#version 300 es
precision mediump float;

in vec2 vTextureCoord;
in float vY;

uniform float timeFactor;

out vec4 fragColor;

void main(void) {
    vec3 col = mix(vec3(1.0, 0.55, 0.0), vec3(1.0, 1.0, 0.0), vTextureCoord.y);
    float pulse = 0.75 + 0.25 * sin(timeFactor * 3.0);
    col *= pulse;
    fragColor = vec4(col, 0.92);
}
