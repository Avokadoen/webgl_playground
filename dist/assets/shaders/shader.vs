attribute vec4 aVertexPosition;
attribute vec3 aTranslation;
attribute vec3 aVertexNormal;

varying highp vec3 vLighting;

uniform mat4 uProjectionMatrix;

void main(void) {
  gl_Position = (uProjectionMatrix * (aVertexPosition + vec4(aTranslation, 1)));

  // Apply lighting effect
  // Note: we compute it in the vertex as this shader is ment for cubes
  highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
  highp vec3 directionalLightColor = vec3(1, 1, 1);
  highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

  highp vec4 transformedNormal = vec4(aVertexNormal, 1.0);

  highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
  vLighting = ambientLight + (directionalLightColor * directional);
}