varying vec2 vUv;
varying vec2 screenUv;
varying vec3 wsNormal;
varying vec3 wsPos;
varying vec3 viewDir;
varying vec3 wsTangent;
varying vec3 wsBinormal;

attribute vec4 tangent;

void main()
{
    vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = pos;
    
    vUv = uv;
    screenUv = (pos.xy / pos.w + vec2(1.0,1.0)) * 0.5;
    wsNormal = normalize((modelViewMatrix * vec4(normal, 0.0)).xyz);
    wsPos = (modelMatrix * vec4(position, 1.0)).xyz;
    viewDir = (viewMatrix * vec4(wsPos-cameraPosition,0.0)).xyz;

    wsTangent = normalize((modelViewMatrix * vec4(tangent.xyz, 0.0)).xyz);
    wsBinormal = cross(wsNormal, wsTangent);

}