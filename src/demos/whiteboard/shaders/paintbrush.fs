varying vec2 vUv;
varying vec4 vWorldPos;

uniform vec3 brushPos;


void main()	{
    float dist = smoothstep(0.5,0.0,length(vWorldPos.xyz-brushPos)) * 0.01;
    gl_FragColor = vec4(dist,0.0,1.0,1.0);
    return;
}
