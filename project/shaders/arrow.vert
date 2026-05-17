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
out float vY;

void main(void) {
    vTextureCoord = aTextureCoord;

    float bob = sin(timeFactor * 2.5) * 0.8;

    vec3 pos = aVertexPosition;
    pos.y += bob;
    vY = pos.y;

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}
