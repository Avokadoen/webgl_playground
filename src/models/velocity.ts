import { vec3 } from 'gl-matrix';

// TODO: rotation should maybe be quaternion 
export interface Velocity {
    positional: vec3;
    angular: vec3;
}

export namespace Velocity {
    export function create(): Velocity {
        return {
            positional: vec3.create(),
            angular: vec3.create()
        }
    }
}