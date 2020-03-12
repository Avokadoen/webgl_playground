import { vec3, vec4 } from 'gl-matrix';

export interface Transform {
    position: vec3; // x, y, z
    rotation: vec4; // quaternion
    // do we need scale?
}