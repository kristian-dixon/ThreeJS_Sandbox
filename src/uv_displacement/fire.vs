varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec3 vViewDir;
uniform float time;

attribute vec4 tangent;

void main()	{

    vUv = uv;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
}