import { Velocity } from "../../models/velocity";
import { mat4, vec3, quat } from 'gl-matrix';
import { IUpdate } from '../iupdate';
import { InputDelegater } from '../input-system/input-delegater';
import { DefaultInput } from '../default-input';
import { Transform, TransformFun } from '../transform.model';

// TODO

export interface CameraConfig {
    fieldOfView?: number;
    zNear?: number;
    zFar?: number;
    turnSensitivity?: number;
    moveSpeed?: number;
}

namespace CameraConfig {
    export function parseConfig(config?: CameraConfig): CameraConfig {
        if (!config) {
            config = defaultValues();
        } else {
            config.fieldOfView = config.fieldOfView ?? 45 * Math.PI / 180;   // in radians
            config.zNear = config.zNear ?? 0.1;
            config.zFar = config.zFar ?? 100.0;
            config.turnSensitivity = config.turnSensitivity ?? 90;
            config.turnSensitivity *= Math.PI / 180;
            config.moveSpeed = config.moveSpeed ?? 10;
        }

        return config;
    }

    function defaultValues(): CameraConfig {
        return {
            fieldOfView: 45 * Math.PI / 180,
            zNear: 0.1,
            zFar: 100.0,
            turnSensitivity: 90 * Math.PI / 180,
            moveSpeed: 10,
        }
    }
}

export interface CameraState {
    velocity: Velocity;
    turnSensitivity: number;
    moveSpeed: number;
    effectiveMoveSpeed: number;
    turnAxis: vec3;
    projection: mat4;
    activeInputs: string[];
    transform: Transform;
    transProjection: mat4;
}

export class Camera implements IUpdate, DefaultInput {
    // TODO: Move this to a vec3 prototype
    readonly worldForward:  vec3 = [ 0,  0,  1];
    readonly worldBackward: vec3 = [ 0,  0, -1];
    readonly worldLeft:     vec3 = [-1,  0,  0];
    readonly worldRigth:    vec3 = [ 1,  0,  0];

    state: CameraState;

    get rotation(): quat {
        return this.state.transform.rotation;
    }

    // TODO: Move this somewhere else
    get forward(): vec3 {
        return this.eulerToLocalDirection([0, 0, 0]);
    }

    get backward(): vec3 {
        return this.eulerToLocalDirection([0, -180, 0]);
    }

    get left(): vec3 {
        return this.eulerToLocalDirection([0, -90, 0]);
    }

    get rigth(): vec3 {
        return this.eulerToLocalDirection([0, 90, 0]);
    }


    private constructor(turnSensitivity: number, moveSpeed: number, projection: mat4) {
        this.state = {
            velocity: Velocity.create(),
            turnSensitivity,
            moveSpeed,
            effectiveMoveSpeed: 0,
            turnAxis: [0, 0, 0],
            projection,
            activeInputs: [],
            transform: TransformFun.create(),
            transProjection: mat4.create()
        }
    }

    public static init(aspect: number, config?: CameraConfig): Camera {
        config = CameraConfig.parseConfig(config);

        const projectionMatrix = mat4.create();
        mat4.perspective(
            projectionMatrix,
            config.fieldOfView,
            aspect,
            config.zNear,
            config.zFar
        );

        
        return new Camera(config.turnSensitivity, config.moveSpeed, projectionMatrix);
    }

    public setDefaultInput(): void {
        // TODO: probably move this into input delegater
        const handleDownInput = (key: string, dir: vec3) => {
            if (this.state.activeInputs.some(i => i === key)) {
                return;
            }

            this.state.activeInputs.push(key);
            this.move(dir);
        }

        const handleUpInput = (key: string, dir: vec3) => {
            const index = this.state.activeInputs.indexOf(key);

            if (index < 0) {
                return;
            }


            this.state.activeInputs.splice(index, 1);
            this.stop(dir);
        }

        const registerKey = (key: string, dir: () => vec3) => {
            InputDelegater.registerKeyPressed(key).subscribe(() => handleDownInput(key, dir()));
            InputDelegater.registerKeyUp(key).subscribe(() => handleUpInput(key, dir()));
        }

        registerKey('w', () => this.forward);
        registerKey('s', () => this.backward);
        registerKey('d', () => this.rigth);
        registerKey('a', () => this.left);

        InputDelegater.registerMouse().subscribe(event => this.turn([event.movementY, event.movementX, 0]));
    }

    public turn(axis: vec3): void {
        vec3.normalize(this.state.turnAxis, axis);
    }

    /*
    * Move camera relative to camera orientation
    */
    public move(direction: vec3): void {
        this.state.effectiveMoveSpeed = this.state.moveSpeed;
        vec3.add(this.state.velocity.positional, direction, this.state.velocity.positional)
        vec3.normalize(this.state.velocity.positional, this.state.velocity.positional);
    }

    public stop(direction: vec3): void {
        for (let index = 0; index < 3; index++) {
            if (Math.abs(direction[index]) > 0) {
                this.state.velocity.positional[index] = 0;
            }            
        }
        vec3.normalize(this.state.velocity.positional, this.state.velocity.positional);
    }    

    // We do some logic that is usually offloaded to shader, but the sum should always be the same for each
    // vertex, so we do it once each frame on the CPU instead
    public update(deltaTime: number): void {
        if (this.state.effectiveMoveSpeed > 0.1 || this.state.effectiveMoveSpeed < -0.1) {
            // TODO: avoid creating vec3 here
            let velocity = vec3.create(); 
            vec3.scale(velocity, this.state.velocity.positional, deltaTime * this.state.effectiveMoveSpeed);
            vec3.add(this.state.transform.position, this.state.transform.position, velocity);
        }
        
      //  vec3.scale(this.state.turnAxis, this.state.turnAxis, deltaTime * this.state.turnSensitivity);
        const turn = quat.fromEuler(quat.create(), this.state.turnAxis[0], this.state.turnAxis[1], this.state.turnAxis[2])
        quat.multiply(this.rotation, this.rotation, turn);

        mat4.identity(this.state.transProjection);
        mat4.multiply(this.state.transProjection, this.state.transProjection, mat4.fromQuat(mat4.create(), this.rotation));
        mat4.translate(this.state.transProjection, this.state.transProjection, this.state.transform.position);
        mat4.multiply(this.state.transProjection, this.state.projection, this.state.transProjection);
        
        this.state.turnAxis = [0, 0, 0];
    }

    private eulerToLocalDirection(euler: vec3): vec3 {
        let rotation = quat.fromEuler(quat.create(), euler[0], euler[1], euler[2]);
        quat.multiply(rotation, rotation, this.rotation);

        const direction = vec3.create();
        direction[0] = 2 * (rotation[0] * rotation[2] - rotation[3] * rotation[1]);
        direction[1] = 2 * (rotation[1] * rotation[2] + rotation[3] * rotation[0]);
        direction[2] = 1 - 2 * (rotation[0] * rotation[0] + rotation[1] * rotation[1]);
        return vec3.normalize(direction, direction);
    }
}