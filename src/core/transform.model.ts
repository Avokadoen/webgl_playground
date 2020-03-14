import { quat, vec3 } from 'gl-matrix';

export interface Transform {
    position: vec3; // x, y, z
    rotation: quat; // quaternion // TODO: introduce quaternion as a concept?
    // do we need scale?
}

// TODO: rename namespaces to same convention
export namespace TransformFun {
    export function create(): Transform {
        return {
            position: vec3.create(),
            rotation: quat.create(),
        };
    }
}