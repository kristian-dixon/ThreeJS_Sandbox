varying vec2 vUv;
varying vec2 vScreenUV;

void main()	{
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    vScreenUV = (gl_Position.xy / gl_Position.w) * 0.5 + 0.5;
}