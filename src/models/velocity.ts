import { vec3, quat } from 'gl-matrix';

// TODO: rotation should maybe be quaternion 
export interface Velocity {
    positional: vec3;
    angular: quat;
}

export namespace Velocity {
    export function create(): Velocity {
        return {
            positional: vec3.create(),
            angular: quat.create()
        }
    }
}