import { ProgramInfo } from '../../models/program-info.model';

export interface Renderable {
    programInfo: ProgramInfo;
    
    initialize(gl: WebGLRenderingContext): void;
    createBuffers(gl: WebGLRenderingContext): void;
    draw(gl: WebGLRenderingContext): void;
}