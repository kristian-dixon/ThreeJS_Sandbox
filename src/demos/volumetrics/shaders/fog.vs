varying vec2 vUv;
varying vec3 vRayDir;
// varying vec2 screenUv;
// varying vec3 wsNormal;
// varying vec3 wsPos;
// varying vec3 viewDir;
// varying vec3 wsTangent;
// varying vec3 wsBinormal;

uniform mat4 inverseProjection;
uniform mat4 inverseView;

//attribute vec4 tangent;

void main()
{
    vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = pos;
    
    vec2 uv = pos.xy / pos.w;
    vUv = uv;
    vRayDir = (inverseView * inverseProjection * vec4(pos.xy,1,1)).xyz;// - inverseProjection * vec4(pos.xy,0,1)).xyz;
}