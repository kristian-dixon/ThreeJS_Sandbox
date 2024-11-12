varying vec2 vUv;
uniform float uTime;
void main()	{

    vUv = uv;

    vec4 uvPosition = vec4(0,0,0,1);
    uvPosition.xy = uv.xy * 0.5 - 1.0;//uv.xy * 2.0 - 1.0;

    vec4 wrappedPosition = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
    
    gl_Position = mix(wrappedPosition,uvPosition, smoothstep(0.0,0.5,fract(uTime)));
}