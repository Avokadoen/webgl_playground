import { mat4 } from 'gl-matrix';
import { ProgramInfo } from "../models/program-info.model";
import { ModelObject } from '../models/model-object.model';
import { Camera } from './camera/camera.model';
import { fromEvent } from 'rxjs';
import { tap } from 'rxjs/operators';

export class Core {
    cubeRotation: number = 0;
    camera: Camera;

    public initWebGL(gl: WebGLRenderingContext, vsSource: string, fsSource: string): void {
        const shaderProgram = this.initShaderProgram(gl, vsSource, fsSource);
        
        // TODO: this should be move to a object-model thing
        const programInfo: ProgramInfo = {
            program: shaderProgram,
            attributeLocation: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
            translation: gl.getAttribLocation(shaderProgram, 'aTranslation'),
            },
            uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
            uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
            },
        };
        
        this.initBuffers(gl, programInfo);
        
        // Load texture
        const texture = this.loadTexture(gl, '../assets/textures/cube_texture.png');
        
        // Tell WebGL to use our program when drawing
        gl.useProgram(programInfo.program);

        this.camera = Camera.init(gl.canvas.width / gl.canvas.height);
        this.camera.setDefaultBindings();
        //this.initInput();

        let then = 0;
        // Draw the scene repeatedly
        const loop = (now: number) => {
            now *= 0.001;  // convert to seconds
            const deltaTime = now - then;
            then = now;
            
            this.updateScene(deltaTime);
            this.drawScene(gl, programInfo, texture);
        
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
    public drawScene(gl: WebGLRenderingContext, programInfo: ProgramInfo, texture: WebGLTexture) {
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
      
        // Set the shader uniforms
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            this.camera.state.projection
        );
      
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix
        );
      
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.normalMatrix,
            false,
            normalMatrix
        );
      
        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);
      
        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);
      
        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
      
        {
            const ext = gl.getExtension("ANGLE_instanced_arrays");
            const indexCount = 36;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            ext.drawElementsInstancedANGLE(gl.TRIANGLES, indexCount, type, offset, 400);
        }
    }

    // // TODO: This logic will be move into a input handler class
    // private initInput() {
    //     const keyDownEvent = fromEvent(document, 'keydown').pipe(
    //         tap((event: KeyboardEvent) => console.log(event.key))
    //     );

    //     // TODO: input class with a key dictionary with functions bound to each used key
    //     keyDownEvent.subscribe((event: KeyboardEvent) => {
    //         if (event.defaultPrevented) {
    //             return; // Do nothing if the event was already processed
    //         }

    //         switch(event.key) {
    //             case 'w':
    //                 this.camera.state.velocity.positional[2] = 10;
    //                 break;
    //             default: 
    //                 this.camera.state.velocity.positional[2] = 0;
    //                 break;
    //         }

    //         event.preventDefault();
    //     });
    // }
      
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
      
      // Initialize a texture and load an image.
      // When the image finished loading copy it into the texture.
    private loadTexture(gl: WebGLRenderingContext, url: string): WebGLTexture {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
      
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
      
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                      width, height, border, srcFormat, srcType,
                      pixel);
      
        const image = new Image();
        image.onload = () => {
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                        srcFormat, srcType, image);
      
          const isPowerOf2 = (value: number) => (value & (value - 1)) == 0;
      
          // WebGL1 has different requirements for power of 2 images
          // vs non power of 2 images so check if the image is a
          // power of 2 in both dimensions.
          if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
              // Yes, it's a power of 2. Generate mips.
              gl.generateMipmap(gl.TEXTURE_2D);
          } else {
              // No, it's not a power of 2. Turn off mips and set
              // wrapping to clamp to edge
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          }
        };
        image.src = url;
      
        return texture;
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
                programInfo.attributeLocation.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
        
            gl.enableVertexAttribArray( programInfo.attributeLocation.vertexPosition);
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
                programInfo.attributeLocation.vertexNormal,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
        
            gl.enableVertexAttribArray(programInfo.attributeLocation.vertexNormal);
        }
      
        const uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
      
        const textureCoordinates = [
            // Front
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Back
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Top
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Bottom
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Right
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Left
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
        ];
      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
      
        // tell webgl how to pull out the texture coordinates from buffer
        {
            const num = 2; // every coordinate composed of 2 values
            const type = gl.FLOAT; // the data in the buffer is 32 bit float
            const normalize = false; // don't normalize
            const stride = 0; // how many bytes to get from one set to the next
            const offset = 0; // how many bytes inside the buffer to start from
            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
            gl.vertexAttribPointer(programInfo.attributeLocation.textureCoord, num, type, normalize, stride, offset);
            gl.enableVertexAttribArray(programInfo.attributeLocation.textureCoord);
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
        const translations = new Float32Array(1200);
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
        gl.enableVertexAttribArray(programInfo.attributeLocation.translation);
        gl.vertexAttribPointer(programInfo.attributeLocation.translation, 3, gl.FLOAT, false, 12, 0);
        ext.vertexAttribDivisorANGLE(programInfo.attributeLocation.translation, 1); // This makes it instanced!
      
        return {
            positionBuffer,
            normalBuffer,
            uvBuffer,
            indexBuffer,
            translationsBuffer
        }
    }
}

