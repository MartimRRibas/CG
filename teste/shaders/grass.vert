#version 300 es
precision highp float;

in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;
uniform float timeFactor;
uniform sampler2D uSplatmap;
uniform vec2 uPatchPos;
uniform float uIsDead;



out vec2 vTextureCoord;
out vec3 vTransformedNormal;
out float vHeight;
out float vIsDead;


void main() {
    vTextureCoord = aTextureCoord;
    vTransformedNormal = normalize(vec3(uNMatrix * vec4(aVertexNormal, 0.0)));
    vHeight = aVertexPosition.y;
    vIsDead = uIsDead;

    // Use patch world position for splatmap — not blade local coords
    float u = (uPatchPos.x / 200.0) + 0.5;
    float v = (uPatchPos.y / 200.0) + 0.5;
    vec3 splat = texture(uSplatmap, vec2(u, v)).rgb;
    float isDeadGrass = step(0.3, splat.b);
    float isGrass = step(0.3, splat.g); // green channel = grass zone
    float isEither    = max(isGrass, isDeadGrass);

    // Wind
    vec3 windDir = normalize(vec3(1.0, 0.0, 0.2));
    float gustStrength = sin(timeFactor * 0.5) * 0.5 + 0.5;
    float ripple = sin(timeFactor * 1.5 + uPatchPos.x * 0.3) * 0.5 + 0.5;
    float windStrength = 0.2 + (gustStrength * 0.5) + (ripple * 0.15);
    float curvature = pow(aVertexPosition.y, 1.2);

    vec4 worldPos = uMVMatrix * vec4(aVertexPosition, 1.0);
    worldPos.x += windDir.x * windStrength * curvature;
    worldPos.z += windDir.z * windStrength * curvature;

    // Hide blade if not in grass zone
    worldPos.y -= (1.0 - isEither) * 100.0;

    gl_Position = uPMatrix * worldPos;
}