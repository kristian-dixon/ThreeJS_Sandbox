#include <packing>

varying vec2 vUv;
varying vec3 vTSEyeDir;
varying vec3 vTSLightDir;
varying vec3 wsPos;
varying vec3 wsViewDir;



uniform sampler2D AlbedoMap;
uniform sampler2D NormalMap;
uniform float BumpScale;



void main()	{ 
    vec3 eyeDir = normalize(vTSEyeDir);

#ifdef standard_parallax
    vec2 offset = eyeDir.xy * BumpScale / eyeDir.z;
    offset *= (1.0 - texture2D(NormalMap, vUv).a);

    vec2 currentTexCoords = -offset + vUv;
    vec4 currentDepthMapValue = texture2D(NormalMap, currentTexCoords);
    float currentLayerDepth = 1.0 - currentDepthMapValue.a;
#else
    float numSteps = 30.0;
    numSteps = mix(numSteps * 4.0, numSteps * 1.0, eyeDir.z);

    float currentLayerDepth = 0.0;
    float perLayerDepth = 1.0/numSteps;
    vec2 delta = eyeDir.xy * BumpScale / (eyeDir.z * numSteps);

    vec2 currentTexCoords = vUv;
    vec4 currentDepthMapValue = texture2D(NormalMap, currentTexCoords);

    while(currentLayerDepth < (1.0 - currentDepthMapValue.a))
    {
        currentLayerDepth += perLayerDepth;
        currentTexCoords -= delta;
        currentDepthMapValue = texture2D(NormalMap, currentTexCoords);
    }
    #ifdef occlusion_mapping
    vec2 prevTexCoords = currentTexCoords + delta;

    float afterDepth = (1.0 - currentDepthMapValue.a) - currentLayerDepth;
    float beforeDepth = (1.0 - texture2D(NormalMap, prevTexCoords).a) - currentLayerDepth + perLayerDepth;
    float weight = afterDepth / (afterDepth - beforeDepth);

    currentTexCoords = mix(currentTexCoords, prevTexCoords, weight);// prevTexCoords * weight + currentTexCoords * (1.0 - weight);
    currentDepthMapValue = texture2D(NormalMap, currentTexCoords);
    //currentLayerDepth = beforeDepth * weight + afterDepth * (1.0 - weight);
    #endif
#endif



    float lit = max(dot(normalize(currentDepthMapValue.xyz * 2.0-1.0), normalize(vTSLightDir)), 0.0);
    gl_FragColor = vec4(texture2D(AlbedoMap, currentTexCoords).rgb * lit, 1.0);
    //gl_FragColor = vec4(eyeDir.zzz, 1.0);
    //gl_FragColor = vec4(texture2D(AlbedoMap, offset).rgb, 1.0);
    //gl_FragColor = vec4((vTSEyeDir), 1.0);
    //gl_FragDepth = 1.0;


    //vec4 ndcPos = vpMat * vec4(wsPos,1.0);
#ifdef depth_correction
    vec4 viewPos = viewMatrix * vec4(wsPos + 
                                    normalize(-wsViewDir) * length(vec3(vUv, 0.0) - vec3(currentTexCoords, currentLayerDepth * BumpScale)),
                                    1.0);

    float depth = viewZToPerspectiveDepth(viewPos.z, 0.01, 10.0 );
    gl_FragDepth = depth;
#endif


    return;
}
