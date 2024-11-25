varying vec2 vUv;
varying vec4 vWorldPos;

uniform vec3 brushPos;
uniform vec3 color;

void main()	{
    float dist = step(length(vWorldPos.xyz-brushPos),0.1);//smoothstep(0.1,0.090,length(vWorldPos.xyz-brushPos)) ;
    gl_FragColor = vec4(color,dist*0.1);
    return;
}
