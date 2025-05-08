varying vec2 vUv;
varying vec3 vTSEyeDir;
varying vec3 vTSLightDir;

uniform mat4 InvModelMatrix;
uniform vec3 LightPos;
//cameraPosition

attribute vec4 tangent;

void main()	{

    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );

    //Move worldspace info to local space
    vec3 osEyePos = (InvModelMatrix * vec4(cameraPosition,1.0)).xyz;
    vec3 osLightPos = (InvModelMatrix * vec4(LightPos,1.0)).xyz;

    mat4 tbn = mat4()
    //Move to tangent space
    vec3 binormal = normalize(cross(normal, tangent.xyz) * tangent.w);
    mat3 tbn = mat3(vTangent, vBinormal, vNormal);
    
    vec3 eyeDir = normalize(osEyePos - posiiton);
    vTSEyeDir = tbn * eyeDir;

    vec3 lightDir = normalize(osLightPos - posiiton);
    vTSLightDir = tbn * lightDir;
}