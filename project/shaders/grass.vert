#version 300 es
precision mediump float;

in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;
uniform float timeFactor;

out vec2 vTextureCoord;
out vec3 vTransformedNormal;
out float vHeight;

void main(void) {
    vTextureCoord = aTextureCoord;
    vTransformedNormal = normalize(vec3(uNMatrix * vec4(aVertexNormal, 0.0)));
    vHeight = aVertexPosition.y;

    float wind = sin(timeFactor * 1.5
                     + aVertexPosition.x * 0.8
                     + aVertexPosition.z * 0.6) * 0.18;

    float influence = max(0.0, aVertexPosition.y - 0.2);

    vec3 pos = aVertexPosition;
    pos.x += wind * influence;
    pos.z += wind * 0.4 * influence;

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}
