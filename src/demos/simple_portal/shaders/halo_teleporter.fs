precision highp float;


#include <packing>

varying vec2 vUv;

varying vec3 vTSEyeDir;

varying vec3 wsPos;
varying vec3 wsViewDir;

uniform sampler2D mainTex;
uniform sampler2D noiseTex;
uniform sampler2D displacementTex;

uniform float displacementStrength;
uniform vec2 displacementUVScale;
uniform vec2 scrollDirection;
uniform float BumpScale;
uniform float time;

uniform vec3 backgroundColourTint;
uniform vec3 foamColourTint;
varying vec3 vColor;

void main()	{ 
    vec3 eyeDir = normalize(vTSEyeDir);

    float rippleCol = 0.0;

    vec2 scrolledUv = (vUv * displacementUVScale) + scrollDirection.yy * time;
    vec2 dispUv = (2.0 * texture2D(displacementTex, scrolledUv).xy) - 1.0;
    dispUv *= displacementStrength;

    rippleCol = texture2D(mainTex, (vUv * 2.0) + (-scrollDirection.yy * time * 2.0) + dispUv).r;


    vec4 noise = texture2D(noiseTex, vUv) * 0.75;
    vec3 outputCol = backgroundColourTint * max(1.0, rippleCol*2.0) + noise.r;


    gl_FragColor = vec4(outputCol.rgb, max(0.5, noise.r + clamp(rippleCol,0.0,1.0)) * pow(vColor.r, 1.0));
    //gl_FragColor = noise;
}
