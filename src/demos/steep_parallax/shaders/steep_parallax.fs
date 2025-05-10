varying vec2 vUv;
varying vec3 vTSEyeDir;
varying vec3 vTSLightDir;

uniform sampler2D AlbedoMap;
uniform sampler2D NormalMap;
uniform float BumpScale;

void main()	{ 
    float numSteps = 60.0;
    float height = 1.0,step = 1.0/numSteps;

    vec2 offset = vUv;

    vec4 NB = texture2D(NormalMap, offset);

    vec3 eyeDir = normalize(vTSEyeDir);

    numSteps = mix(numSteps * 2.0, numSteps, eyeDir.z);
    vec2 delta = vec2(-eyeDir.x, -eyeDir.y) * BumpScale / (eyeDir.z * numSteps);

    while( NB.a < height)
    {
        height -= step;
        offset += delta;

        NB = texture2D(NormalMap, offset);
    }

    

    float lit = max(dot(normalize(NB.xyz * 2.0-1.0), normalize(vTSLightDir)), 0.0);
    //lit = NB.z * vTSLightDir.z;
    //lit = NB.z;
    gl_FragColor = vec4(texture2D(AlbedoMap, offset).rgb * lit, 1.0);
    //gl_FragColor = vec4(texture2D(AlbedoMap, offset).rgb, 1.0);

    //gl_FragColor = vec4((vTSEyeDir), 1.0);
    return;
}
