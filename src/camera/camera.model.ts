import { Velocity } from "../models/velocity";
import { mat4, vec3 } from 'gl-matrix';
import { IUpdate } from '../core/i-update';

export interface CameraConfig {
    fieldOfView?: number;
    zNear?: number;
    zFar?: number;
}

namespace CameraConfig {
    export function parseConfig(config?: CameraConfig): CameraConfig {
        if (!config) {
            config = CameraConfig.defaultValues();
        } else {
            config.fieldOfView  = config.fieldOfView    ?? 45 * Math.PI / 180;   // in radians
            config.zNear        = config.zNear          ?? 0.1;
            config.zFar         = config.zFar           ?? 100.0;
        }

        return config;
    }

    export function defaultValues(): CameraConfig {
        return {
            fieldOfView: 45 * Math.PI / 180,
            zNear: 0.1,
            zFar: 100.0,
        }
    }
}

export interface CameraState {
    velocity: Velocity;
    projection: mat4;
}

export class Camera implements IUpdate {
    state: CameraState;

    private constructor(projection: mat4) {
        this.state = {
            velocity: Velocity.identity(),
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

        return new Camera(projectionMatrix);
        
    }

    public update(deltaTime: number): void {
        const velocity = vec3.create(); 
        vec3.scale(velocity, this.state.velocity.positional, deltaTime);
        mat4.translate(this.state.projection, this.state.projection, velocity);
    }
}