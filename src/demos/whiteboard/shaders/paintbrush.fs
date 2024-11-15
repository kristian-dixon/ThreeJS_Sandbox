varying vec2 vUv;
varying vec4 vWorldPos;

uniform vec3 brushPos;


void main()	{
    //float dist = smoothstep(1000.2,1000.0,length(vWorldPos.xyz-brushPos)) * 0.01;
    gl_FragColor = vec4(1,0,1,1);
    return;
}
