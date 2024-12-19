varying vec2 vUv;
varying vec4 vWorldPos;

uniform vec2 jitter;

void main()	{

    vUv = uv;
    vWorldPos = modelMatrix * vec4(position,1.0);

    vec4 uvPosition = vec4(0,0,0,1);
    uvPosition.xy = uv.xy * 2.0 - 1.0;
    uvPosition.xy += jitter;
    
    gl_Position = uvPosition;
}