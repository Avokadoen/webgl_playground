import { Renderable } from "../renderable";
import { ProgramInfo } from '../../../models/program-info.model';
import { mat4, vec4 } from 'gl-matrix';

export class Cube implements Renderable {
    programInfo: ProgramInfo;

    normalMatrix: mat4;
    color: vec4;

    public initialize(gl: WebGLRenderingContext, program: WebGLProgram, instances: number): void {
        this.programInfo = {
            program,
            attributes: {
                vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
                vertexNormal: gl.getAttribLocation(program, 'aVertexNormal'),
                translation: gl.getAttribLocation(program, 'aTranslation'),
            },
            uniforms: {
                projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
                normalMatrix: gl.getUniformLocation(program, 'uNormalMatrix'),
                color: gl.getUniformLocation(program, 'uColor'),
            }
        };

        gl.useProgram(this.programInfo.program);
        this.createBuffers(gl, instances);
        this.createUniforms(gl);
    }

    public createBuffers(gl: WebGLRenderingContext, instances: number): void {
          // position data
          const positionBuffer = gl.createBuffer();
      
          gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        
          const positions = [
              // Front face
              -1.0, -1.0,  1.0,
              1.0, -1.0,  1.0,
              1.0,  1.0,  1.0,
              -1.0,  1.0,  1.0,
              
              // Back face
              -1.0, -1.0, -1.0,
              -1.0,  1.0, -1.0,
              1.0,  1.0, -1.0,
              1.0, -1.0, -1.0,
              
              // Top face
              -1.0,  1.0, -1.0,
              -1.0,  1.0,  1.0,
              1.0,  1.0,  1.0,
              1.0,  1.0, -1.0,
              
              // Bottom face
              -1.0, -1.0, -1.0,
              1.0, -1.0, -1.0,
              1.0, -1.0,  1.0,
              -1.0, -1.0,  1.0,
              
              // Right face
              1.0, -1.0, -1.0,
              1.0,  1.0, -1.0,
              1.0,  1.0,  1.0,
              1.0, -1.0,  1.0,
              
              // Left face
              -1.0, -1.0, -1.0,
              -1.0, -1.0,  1.0,
              -1.0,  1.0,  1.0,
              -1.0,  1.0, -1.0,
          ];
        
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
          
          {
              const numComponents = 3;
              const type = gl.FLOAT;   
              const normalize = false; 
              const stride = 0;       
              const offset = 0;        
              gl.vertexAttribPointer(
                  this.programInfo.attributes.vertexPosition,
                  numComponents,
                  type,
                  normalize,
                  stride,
                  offset
              );
          
              gl.enableVertexAttribArray(this.programInfo.attributes.vertexPosition);
          }
        
          const normalBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        
          const vertexNormals = [
              // Front
              0.0,  0.0,  1.0,
              0.0,  0.0,  1.0,
              0.0,  0.0,  1.0,
              0.0,  0.0,  1.0,
          
              // Back
              0.0,  0.0, -1.0,
              0.0,  0.0, -1.0,
              0.0,  0.0, -1.0,
              0.0,  0.0, -1.0,
          
              // Top
              0.0,  1.0,  0.0,
              0.0,  1.0,  0.0,
              0.0,  1.0,  0.0,
              0.0,  1.0,  0.0,
          
              // Bottom
              0.0, -1.0,  0.0,
              0.0, -1.0,  0.0,
              0.0, -1.0,  0.0,
              0.0, -1.0,  0.0,
          
              // Right
              1.0,  0.0,  0.0,
              1.0,  0.0,  0.0,
              1.0,  0.0,  0.0,
              1.0,  0.0,  0.0,
          
              // Left
              -1.0,  0.0,  0.0,
              -1.0,  0.0,  0.0,
              -1.0,  0.0,  0.0,
              -1.0,  0.0,  0.0
          ];
        
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
        
          {
              const numComponents = 3;
              const type = gl.FLOAT;
              const normalize = false;
              const stride = 0;
              const offset = 0;
              gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
              gl.vertexAttribPointer(
                this.programInfo.attributes.vertexNormal,
                  numComponents,
                  type,
                  normalize,
                  stride,
                  offset
              );
          
              gl.enableVertexAttribArray(this.programInfo.attributes.vertexNormal);
          }
        
          // index data
          const indexBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        
          const indices = [
              0,  1,  2,      0,  2,  3,    // front
              4,  5,  6,      4,  6,  7,    // back
              8,  9,  10,     8,  10, 11,   // top
              12, 13, 14,     12, 14, 15,   // bottom
              16, 17, 18,     16, 18, 19,   // right
              20, 21, 22,     20, 22, 23,   // left
          ];
        
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        
          let index = 0;
          const translations = new Float32Array(3000);
          for(let z = -10; z < 10; z += 2) {
            for(let y = -10; y < 10; y += 2) {
              for(let x = -10; x < 10; x += 2) {
                  translations[index++] = x;      // x
                  translations[index++] = y;      // y
                  translations[index++] = z - 50; // z
              }
            }
          }
        
          const translationsBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, translationsBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, translations, gl.STATIC_DRAW);
        
          // TODO: Remove use of extension, use WebGL 2.0 instancing instead.
          const ext = gl.getExtension("ANGLE_instanced_arrays");
          gl.enableVertexAttribArray(this.programInfo.attributes.translation);
          gl.vertexAttribPointer(this.programInfo.attributes.translation, 3, gl.FLOAT, false, 12, 0);
          ext.vertexAttribDivisorANGLE(this.programInfo.attributes.translation, 1); // This makes it instanced!
        
    }

    public createUniforms(gl: WebGLRenderingContext): void {
        this.normalMatrix = mat4.create();
        mat4.transpose(this.normalMatrix, this.normalMatrix);
  
        this.color = [1.0, 0.0, 0.0, 1.0] as vec4;
      
        gl.uniformMatrix4fv(
            this.programInfo.uniforms.normalMatrix,
            false,
            this.normalMatrix
        );

        gl.uniform4fv(
            this.programInfo.uniforms.color,
            this.color
        )
    }

    public draw(gl: WebGLRenderingContext, camera: mat4): void {
        gl.useProgram(this.programInfo.program);
        
        // Set the shader uniforms
        gl.uniformMatrix4fv(
            this.programInfo.uniforms.projectionMatrix,
            false,
            camera
        );

        {
            const ext = gl.getExtension("ANGLE_instanced_arrays");
            const indexCount = 36;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            ext.drawElementsInstancedANGLE(gl.TRIANGLES, indexCount, type, offset, 1000);
        }
    }
}