varying vec2 vUv;
varying mat3 vTBN;
varying vec3 vViewDir;

uniform vec3 impactNormal;
uniform float impactDepth;

attribute vec4 tangent;

#define PI 3.14159

void main()	{
    
    vec3 distortedPosition = position;
    float distortionStrength = 0.0;
    vec3 impactPos = impactNormal * 0.25 + impactDepth * impactNormal;
    vec3 dirToImpact = normalize(impactPos - position);

    
    //
    float entryDist = length(position - impactNormal * 0.25);

    distortionStrength = smoothstep(abs(impactDepth), 0.0, entryDist) * 0.5;
    distortionStrength += smoothstep(abs(impactDepth) * 10.0, abs(impactDepth), entryDist) * 0.5;
   
    distortedPosition += impactNormal * impactDepth * distortionStrength;
    


    //distortedPosition += dirToImpact * distortionStrength;
    
    


    //vec4 worldPos = modelMatrix * vec4(position, 1.0 );
    vec4 worldPos = modelMatrix * vec4(distortedPosition, 1.0);

    gl_Position = projectionMatrix * viewMatrix * worldPos;


    vUv = uv;
    vec3 vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    
    vec3 vTangent = normalize((modelMatrix * vec4(tangent.xyz, 0.0)).xyz);
    vec3 vBinormal = normalize(cross(vNormal, vTangent.xyz) * tangent.w);
    vTBN = mat3(vTangent, vBinormal, vNormal);

    vec3 viewDir = normalize(cameraPosition - worldPos.xyz);
    vViewDir = viewDir;
}