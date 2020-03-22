import { mat4, vec4 } from 'gl-matrix';
import { ProgramInfo } from "../models/program-info.model";
import { ModelObject } from '../models/model-object.model';
import { Camera } from './camera/camera.model';
import { InputDelegater } from './input-system/input-delegater';

export class Core {
    cubeRotation: number = 0;
    camera: Camera;

    public initWebGL(gl: WebGLRenderingContext, vsSource: string, fsSource: string): void {
        const shaderProgram = this.initShaderProgram(gl, vsSource, fsSource);
        
        // TODO: this should be move to a object-model thing
        const programInfo: ProgramInfo = {
            program: shaderProgram,
            attributes: {
                vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
                translation: gl.getAttribLocation(shaderProgram, 'aTranslation'),
            },
            uniforms: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
                normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
                color: gl.getUniformLocation(shaderProgram, 'uColor'),
            }
        };
        
        this.initBuffers(gl, programInfo);
        
        
        // Tell WebGL to use our program when drawing
        gl.useProgram(programInfo.program);

        this.camera = Camera.init(gl.canvas.width / gl.canvas.height);
        
        this.camera.setDefaultInput(gl.canvas as HTMLCanvasElement );
        
        let then = 0;
        // Draw the scene repeatedly
        const loop = (now: number) => {
            now *= 0.001;  // convert to seconds
            const deltaTime = now - then;
            then = now;
            
            this.updateScene(deltaTime);
            this.drawScene(gl, programInfo);
        
            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);
    }

    public updateScene(deltaTime: number) {
        this.camera.update(deltaTime);
        this.cubeRotation += deltaTime;
    }

    // TODO: draw scene should not care about delta time, all uniforms should be accessed through ProgramInfo, or another 
    //       unkown concept
    public drawScene(gl: WebGLRenderingContext, programInfo: ProgramInfo) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        gl.clearDepth(1.0);                 // Clear everything
        gl.enable(gl.DEPTH_TEST);           // Enable depth testing
        gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
      
        // Clear the canvas before we start drawing on it.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
        const modelViewMatrix = mat4.create();
        mat4.rotate(modelViewMatrix, modelViewMatrix, this.cubeRotation, [0, 0, 1]);
        mat4.rotate(modelViewMatrix, modelViewMatrix, this.cubeRotation * .7, [0, 1, 0]);
      
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, modelViewMatrix);
        mat4.transpose(normalMatrix, normalMatrix);

        const color = [1.0, 0.0, 0.0, 1.0] as vec4;
        
      
        // Set the shader uniforms
        gl.uniformMatrix4fv(
            programInfo.uniforms.projectionMatrix,
            false,
            this.camera.state.transProjection
        );
      
        gl.uniformMatrix4fv(
            programInfo.uniforms.modelViewMatrix,
            false,
            modelViewMatrix
        );
      
        gl.uniformMatrix4fv(
            programInfo.uniforms.normalMatrix,
            false,
            normalMatrix
        );

        gl.uniform4fv(
            programInfo.uniforms.color,
            color
        )
      
        {
            const ext = gl.getExtension("ANGLE_instanced_arrays");
            const indexCount = 36;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            ext.drawElementsInstancedANGLE(gl.TRIANGLES, indexCount, type, offset, 1000);
        }
    }

    // TODO: return error type if failed
    // Initialize a shader program, so WebGL knows how to draw our data
    private initShaderProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram | null {
        const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
      
        // Create the shader program
        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
      
        // If creating the shader program failed, alert
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
          alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
          return null;
        }
      
        return shaderProgram;
    }
      
      // creates a shader of the given type, uploads the source and
      // compiles it.
    private loadShader(gl: WebGLRenderingContext, type: GLenum, source: string): WebGLShader | null {
        const shader = gl.createShader(type);
        
        // Send the source to the shader object
        gl.shaderSource(shader, source);
        
        // Compile the shader program
        gl.compileShader(shader);
        
        // See if it compiled successfully
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
      
    // TODO: Allow for any position and color buffer
    // Creates our position, index and color buffer data which it also sends to the GPU
    private initBuffers(gl: WebGLRenderingContext, programInfo: ProgramInfo): ModelObject {
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
                programInfo.attributes.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
        
            gl.enableVertexAttribArray(programInfo.attributes.vertexPosition);
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
                programInfo.attributes.vertexNormal,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
        
            gl.enableVertexAttribArray(programInfo.attributes.vertexNormal);
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
                translations[index++] = x;   // x
                translations[index++] = y;   // y
                translations[index++] = z - 50;     // z
            }
          }
        }
      
        const translationsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, translationsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, translations, gl.STATIC_DRAW);
      
        // TODO: Remove use of extension, use WebGL 2.0 instancing instead.
        const ext = gl.getExtension("ANGLE_instanced_arrays");
        gl.enableVertexAttribArray(programInfo.attributes.translation);
        gl.vertexAttribPointer(programInfo.attributes.translation, 3, gl.FLOAT, false, 12, 0);
        ext.vertexAttribDivisorANGLE(programInfo.attributes.translation, 1); // This makes it instanced!
      
        return {
            positionBuffer,
            normalBuffer,
            indexBuffer,
            translationsBuffer
        }
    }
}

