#version 300 es
precision highp float;

in vec2 vTextureCoord;
in vec3 vTransformedNormal;
in float vHeight;
in float vIsDead;


out vec4 fragColor;

void main() {
    vec4 darkGreen  = vec4(0.04, 0.2, 0.05, 1.0);
    vec4 lightGreen = vec4(0.4, 0.9, 0.2, 1.0);
    vec4 deadColor  = vec4(0.55, 0.45, 0.1, 1.0);


    vec4 liveColor = mix(darkGreen, lightGreen, vHeight / 1.15);
    fragColor = mix(liveColor, deadColor, vIsDead);
}