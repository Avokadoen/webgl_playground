import { vec3 } from 'gl-matrix';

// TODO: rotation should maybe be quaternion 
export interface Velocity {
    positional: vec3;
    angular: vec3;
}

export namespace Velocity {
    export function identity(): Velocity {
        return {
            positional: [0, 0, 0],
            angular: [0, 0, 0]
        }
    }
}