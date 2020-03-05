export interface ProgramInfo {
    program: WebGLProgram;
    attributeLocation: {
        vertexPosition: GLint;
        textureCoord: GLint;
        vertexNormal: GLint;
    };
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation | null;
        modelViewMatrix: WebGLUniformLocation | null;
        normalMatrix: WebGLUniformLocation | null;
        uSampler: WebGLUniformLocation | null;
    };
}