#version 300 es
precision highp float;

in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

out vec2 vTexCoord;      // tiled — for soil/path/dead textures
out vec2 vSplatCoord;    // 0 to 1 — for splatmap
out float vHeight;

void main() {
    vHeight = aVertexPosition.y;
    float u = (aVertexPosition.x / 200.0) + 0.5;
    float v = (aVertexPosition.z / 200.0) + 0.5;
    vTexCoord = vec2(u, v);
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}