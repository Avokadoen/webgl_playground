export interface ProgramInfo {
    program: WebGLProgram;
    attributes: { [name: string]: GLint };
    uniforms: { [name: string]: WebGLUniformLocation | null };
}