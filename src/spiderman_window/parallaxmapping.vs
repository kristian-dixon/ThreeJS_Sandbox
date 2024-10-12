varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec3 vViewDir;
uniform float time;

attribute vec4 tangent;

void main()	{

    vUv = uv;
    vNormal = normalize( ( vec4(normal, 0)).xyz);
    vTangent = normalize( ( vec4(tangent.xyz,0)).xyz);
    vBinormal = normalize(cross(vNormal, vTangent.xyz) * tangent.w);

    vec3 viewDir = ((modelMatrix * vec4(position,1.0)).xyz - cameraPosition);
    vViewDir = vec3(
        dot(viewDir, vTangent),
        dot(viewDir, vBinormal),
        -dot(viewDir, vNormal)
    );

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
}