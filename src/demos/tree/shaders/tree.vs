precision highp float;

varying vec2 vUv;
varying vec3 norm;

attribute vec3 _bushynormal;

void main()	{

    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    norm = _bushynormal;
}