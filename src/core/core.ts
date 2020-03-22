import { Camera } from './camera/camera.model';
import { Cube } from './game-object/primitives/cube'

export class Core {
    camera: Camera;
    cubes: Cube;

    // TODO: move loading of the cube shader inside cube itself, or atleast inside core
    public initWebGL(gl: WebGLRenderingContext, vsSource: string, fsSource: string): void {
        const cubeProgram = this.initShaderProgram(gl, vsSource, fsSource);
        this.cubes = new Cube();
        this.cubes.initialize(gl, cubeProgram, 1000);

        this.camera = Camera.init(gl.canvas.width / gl.canvas.height);
        
        this.camera.setDefaultInput(gl.canvas as HTMLCanvasElement );
        
        let then = 0;
        // Draw the scene repeatedly
        const loop = (now: number) => {
            now *= 0.001;  // convert to seconds
            const deltaTime = now - then;
            then = now;
            
            this.updateScene(deltaTime);
            this.drawScene(gl);
        
            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);
    }

    public updateScene(deltaTime: number) {
        this.camera.update(deltaTime);
    }

    // TODO: draw scene should not care about delta time, all uniforms should be accessed through ProgramInfo, or another 
    //       unkown concept
    public drawScene(gl: WebGLRenderingContext) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        gl.clearDepth(1.0);                 // Clear everything
        gl.enable(gl.DEPTH_TEST);           // Enable depth testing
        gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
      
        // Clear the canvas before we start drawing on it.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   
        this.cubes.draw(gl, this.camera.projection);
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
}