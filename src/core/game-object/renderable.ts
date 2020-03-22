import { ProgramInfo } from '../../models/program-info.model';
import { mat4 } from 'gl-matrix';

export interface Renderable {
    programInfo: ProgramInfo;

    initialize(gl: WebGLRenderingContext, program: WebGLProgram, instances: number): void;
    createBuffers(gl: WebGLRenderingContext, instances: number): void;
    createUniforms(gl: WebGLRenderingContext): void;
    draw(gl: WebGLRenderingContext, camera: mat4): void;
}