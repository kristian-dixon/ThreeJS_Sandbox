varying vec2 vUv;

void main()	
{
    vUv = uv;
    
    vec4 uvPosition = vec4(0,0,0,1);
    uvPosition.xy = uv.xy * 2.0 - 1.0;
    gl_Position = uvPosition;
}