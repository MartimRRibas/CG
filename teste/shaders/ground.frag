#version 300 es
precision highp float;

in vec2 vTexCoord;
in float vHeight;


uniform sampler2D uGrassTex;
uniform sampler2D uDeadTex;
uniform sampler2D uGravelTex;
uniform sampler2D uSplatmap;

out vec4 fragColor;

void main() {
    vec3 splat = texture(uSplatmap, vTexCoord).rgb;

    vec4 grass  = texture(uGrassTex,  vTexCoord*10.0);
    vec4 dead   = texture(uDeadTex,   vTexCoord*10.0);
    vec4 gravel = texture(uGravelTex, vTexCoord*10.0);

    if (vHeight > 3.0) {
        // montanha — cor de rocha fixa
        fragColor = vec4(0.65, 0.55, 0.45, 1.0);
        return;
    }

    fragColor = grass  * splat.g
              + gravel * splat.r
              + dead   * splat.b;

}