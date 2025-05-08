varying vec2 vUv;
varying vec3 vTSEyeDir;
varying vec3 vTSLightDir;

uniform sampler2D AlbedoMap;
uniform sampler2D NormalMap;
uniform float BumpScale;

void main()	{ 
    const float numSteps = 30.0;
    float height = 1.0,step = 1.0/numSteps;

    vec2 offset = vUv;

    vec4 NB = texture2D(NormalMap, offset);
    vec2 delta = vec2(-vTSEyeDir.x, vTSEyeDir.y) * BumpScale / (-vTSEyeDir.z * numSteps);

    while(NB.a < height)
    {
        height -= step;
        offset += delta;

        NB = texture2D(NormalMap, offset);
    }

    gl_FragColor = texture2D(AlbedoMap, offset);

    gl_FragColor = vec4(abs(vTSEyeDir), 1.0);
    return;
}
