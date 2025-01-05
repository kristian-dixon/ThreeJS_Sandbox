varying vec2 vUv;

void main()
{
    vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = pos;
    
    vUv = uv;
}