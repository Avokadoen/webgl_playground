import { merge } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ShaderLoading } from './shader/shader-loader';
import { Shader, ShaderType } from './models/shader.model';
import { Core } from './core/core';

// current: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Lighting_in_WebGL

window.onload = main;

function main() {

  const canvas = document.querySelector("#glCanvas") as HTMLCanvasElement;

  let gl: WebGLRenderingContext | null;
  const handleResize = () => {
    // TODO: Configure this with some menu
    // TODO: There is more logic that has to be rerun in this event for this to work properly
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize the GL context
    gl = canvas.getContext("webgl");
  }
  
  handleResize();
  //fromEvent(document, 'resize').subscribe(() => handleResize());

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
  }

  const core = new Core();

  let vsSource: string = undefined;
  let fsSource: string = undefined;
  merge(ShaderLoading.fetchShaderSource('shader.fs'), ShaderLoading.fetchShaderSource('shader.vs')).pipe(
    filter((parsed: Shader) => {
      switch (parsed.type) {
        case (ShaderType.Vertex):
          vsSource = parsed.source;
          break;
        case (ShaderType.Fragment):
          fsSource = parsed.source;
          break;
      }
      return !!vsSource && !!fsSource;
    }),
  ).subscribe(() => core.initWebGL(gl, vsSource, fsSource));
}
