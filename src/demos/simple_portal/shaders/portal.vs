precision highp float;

varying vec2 vUv;
varying vec3 vTSEyeDir;

varying vec3 wsPos;
varying vec3 wsViewDir;
varying vec3 vColor;


//cameraPosition

attribute vec4 tangent;
attribute vec3 color;

void main()	{
    vColor = color;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    wsPos = (modelMatrix * vec4(position,1.0)).xyz;
    //Move worldspace info to local space
    vec3 osEyePos = cameraPosition;

    //Move to tangent space
    vec3 binormal = normalize(cross(normal, tangent.xyz) * tangent.w);
    mat3 tbn = mat3(tangent.xyz, binormal, normal);
    
    vec3 eyeDir = normalize(osEyePos - (modelMatrix * vec4(position, 1.0)).xyz);
    wsViewDir = eyeDir;
    vTSEyeDir =  tbn * eyeDir;
}