precision highp float;


#include <packing>

varying vec2 vUv;

varying vec3 vTSEyeDir;

varying vec3 wsPos;
varying vec3 wsViewDir;

uniform sampler2D mainTex;
uniform sampler2D foamTex;
uniform sampler2D displacementTex;

uniform float displacementStrength;
uniform vec2 displacementUVScale;
uniform vec2 scrollDirection;
uniform float BumpScale;
uniform float time;

uniform vec3 backgroundColourTint;
uniform vec3 foamColourTint;


void main()	{ 
    vec3 eyeDir = normalize(vTSEyeDir);

    #ifdef SIMPLE_SCROLL
    vec2 dispUv = scrollDirection * time * 4.0;
    #else
    vec2 scrolledUv = (vUv * displacementUVScale) + scrollDirection * time;
    vec2 dispUv = (2.0 * texture2D(displacementTex, scrolledUv).xy) - 1.0;
    dispUv *= displacementStrength;
    #endif


    float numSteps = 30.0;
    numSteps = mix(numSteps * 4.0, numSteps * 1.0, eyeDir.z);

    float currentLayerDepth = 0.0;
    float perLayerDepth = 1.0/numSteps;
    vec2 delta = vec2(eyeDir.x, -eyeDir.y) * BumpScale / (eyeDir.z * numSteps);

    vec2 currentTexCoords = vUv + dispUv * 0.1;
    vec4 currentDepthMapValue = texture2D(mainTex, currentTexCoords );

    while(currentLayerDepth < (1.0 - currentDepthMapValue.r))
    {
        currentLayerDepth += perLayerDepth;
        currentTexCoords -= delta;
        currentDepthMapValue = texture2D(mainTex, currentTexCoords);
    }
    vec2 prevTexCoords = currentTexCoords + delta;

    float afterDepth = (1.0 - currentDepthMapValue.a) - currentLayerDepth;
    float beforeDepth = (1.0 - texture2D(mainTex, prevTexCoords).r) - currentLayerDepth + perLayerDepth;
    float weight = afterDepth / (afterDepth - beforeDepth);

    currentTexCoords = mix(currentTexCoords, prevTexCoords, weight);// prevTexCoords * weight + currentTexCoords * (1.0 - weight);
    currentDepthMapValue = texture2D(mainTex, currentTexCoords);
    //currentLayerDepth = (1.0 - currentDepthMapValue.r);

    // if(currentTexCoords.x < 0.0 || currentTexCoords.x > 1.0 || currentTexCoords.y < 0.0 || currentTexCoords.y > 1.0)
    //     discard;

    vec3 background = texture2D(mainTex, currentTexCoords).rgb * backgroundColourTint;
    vec3 foam = texture2D(foamTex, currentTexCoords).rgb * foamColourTint;

    vec3 outputCol = background + vec3(0.2,0.2,0.2);

  

    gl_FragColor = vec4(outputCol.rgb, 1.0);



    vec4 viewPos = viewMatrix * vec4(wsPos + 
                                    normalize(-wsViewDir) * length(vec3(vUv + dispUv * 0.1, 0.0) - vec3(currentTexCoords, currentLayerDepth * BumpScale)),
                                    1.0);

    float depth = viewZToPerspectiveDepth(viewPos.z, 0.01, 10.0 );
    gl_FragDepth = depth;
}
