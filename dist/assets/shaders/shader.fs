varying highp vec3 vLighting;

uniform highp vec4 uColor;

void main(void) {
  gl_FragColor = vec4(uColor.rgb * vLighting, uColor.a);
}