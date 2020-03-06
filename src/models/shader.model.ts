export enum ShaderType {
    Vertex,
    Fragment,
    Unkown
}

export namespace ShaderType {
    export function fromExtension(filepath: string) {
        switch(filepath.split('.', 2)[1]) {
            case 'vs':
                return ShaderType.Vertex;
            case 'fs':
                return ShaderType.Fragment;
            default:
                return ShaderType.Unkown;
        }
    }
}

export interface Shader {
    type: ShaderType;
    source: string;
}