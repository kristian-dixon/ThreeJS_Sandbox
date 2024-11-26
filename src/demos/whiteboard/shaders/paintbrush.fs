varying vec2 vUv;
varying vec4 vWorldPos;

uniform vec3 brushPos;
uniform vec3 color;

uniform float blendStrength;
uniform float brushRadius;
uniform float brushFalloff;

void main()	{
    float dist = step(length(vWorldPos.xyz-brushPos),brushRadius);//smoothstep(0.1,0.090,length(vWorldPos.xyz-brushPos)) ;
    gl_FragColor = vec4(color,dist*brushFalloff);
    return;
}
