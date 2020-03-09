import { Velocity } from "../../models/velocity";
import { mat4, vec3 } from 'gl-matrix';
import { IUpdate } from '../i-update';

// TODO

export interface CameraConfig {
    fieldOfView?: number;
    zNear?: number;
    zFar?: number;
    turnSensitivity?: number;
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
        }

        return config;
    }

    function defaultValues(): CameraConfig {
        return {
            fieldOfView: 45 * Math.PI / 180,
            zNear: 0.1,
            zFar: 100.0,
            turnSensitivity: 90 * Math.PI / 180
        }
    }
}

export interface CameraState {
    velocity: Velocity;
    turnSensitivity: number;
    turnAxis: vec3;
    projection: mat4;
}

export class Camera implements IUpdate {
    state: CameraState;

    private constructor(turnSensitivity: number, projection: mat4) {
        this.state = {
            velocity: Velocity.identity(),
            turnSensitivity,
            turnAxis: [0, 0, 0],
            projection
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

        return new Camera(config.turnSensitivity, projectionMatrix);
    }

    public setTurnAxis(turnAxis: vec3): void {
        this.state.turnAxis = turnAxis;
    }

    public update(deltaTime: number): void {
        const velocity = vec3.create(); 
        vec3.scale(velocity, this.state.velocity.positional, deltaTime);
        mat4.translate(this.state.projection, this.state.projection, velocity);
        mat4.rotate(this.state.projection, this.state.projection, this.state.turnSensitivity * deltaTime, this.state.turnAxis);
    }
}