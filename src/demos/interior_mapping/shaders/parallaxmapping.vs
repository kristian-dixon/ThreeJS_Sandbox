varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec3 vViewDir;
varying vec3 vWsViewDir;
uniform float time;

attribute vec4 tangent;

void main()	{

    vUv = uv;
    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vTangent = normalize((modelMatrix * vec4(tangent.xyz,0.0)).xyz);
    vBinormal = normalize(cross(vNormal, vTangent.xyz) * tangent.w);

    vec3 viewDir = normalize((modelMatrix * vec4(position,1.0)).xyz - cameraPosition);
    vWsViewDir = (viewDir);

    mat3 tbn = mat3(vTangent, vBinormal, vNormal);
    vViewDir = tbn * viewDir;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
}