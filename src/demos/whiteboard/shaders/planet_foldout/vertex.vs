varying vec2 vUv;
uniform float uTime;
uniform float uRatio;
void main()	{

    vUv = uv;

    vec4 uvPosition = vec4(uv.xy,0,1);
    uvPosition.x /= uRatio;
    uvPosition.xy = uvPosition.xy * 0.5 - 1.0;//uv.xy * 2.0 - 1.0;
    //

    vec4 truePostion = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
    
    gl_Position = mix(truePostion,uvPosition, smoothstep(0.0,0.5,fract(uTime))); 
    //gl_Position = uvPosition;
}