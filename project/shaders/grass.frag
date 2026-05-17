#version 300 es
precision mediump float;

in vec2 vTextureCoord;
in vec3 vTransformedNormal;
in float vHeight;

out vec4 fragColor;

void main(void) {
    float t = clamp(vHeight, 0.0, 1.0);

    vec3 liveGrass = mix(vec3(0.15, 0.45, 0.08), vec3(0.35, 0.65, 0.12), t);
    vec3 deadGrass = mix(vec3(0.45, 0.38, 0.12), vec3(0.62, 0.55, 0.20), t);

    float d = step(0.65, clamp(sin(vTextureCoord.x * 17.3 + vTextureCoord.y * 5.1) * 0.5 + 0.5, 0.0, 1.0)) * 0.7;
    vec3 colour = mix(liveGrass, deadGrass, d);

    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    float diff = max(dot(normalize(vTransformedNormal), lightDir), 0.1);
    colour *= (0.5 + 0.6 * diff);

    fragColor = vec4(colour, 1.0 - t * 0.3);
}
