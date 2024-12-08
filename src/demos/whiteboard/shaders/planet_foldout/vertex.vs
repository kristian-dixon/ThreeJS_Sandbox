varying vec2 vUv;
uniform float uTime;
uniform float uRatio;
void main()	{

    vUv = uv;

    vec4 uvPosition = vec4(uv.x, 1.0 - uv.y,0,1);

    #ifdef FIX_ASPECT
    uvPosition.x /= uRatio;
    #endif
    uvPosition.xy = uvPosition.xy;// * 0.5 - 1.0;//uv.xy * 2.0 - 1.0;
    //


    vec4 outputPosition = vec4(uvPosition.xy * 0.5 - 1.0,0, 1);

    #ifdef FOLDOUT_EFFECT
        //float wrappedTime = mod(uTime, 3.0);
        float wrappedTime = uTime;
        vec3 pos = position;
        vec3 normalOffset =  normal * 0.02;

        pos = mix(pos, pos + normalOffset, smoothstep(0.0,0.2,wrappedTime));


        vec4 clipSpaceVertexPos = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

        //uvPosition.xy = mix( uvPosition.xy * 2.0 - 1.0,  uvPosition.xy * 0.5 - 1.0, smoothstep(1.1,1.3,wrappedTime));
        uvPosition.xy = mix( uvPosition.xy * 2.0 - 1.0,  uvPosition.xy * 0.5 - 1.0, 0.0);

        outputPosition = mix(clipSpaceVertexPos, uvPosition, smoothstep(0.2,1.0,wrappedTime));
    #endif

    
    gl_Position = outputPosition;
    //gl_Position = uvPosition;
}