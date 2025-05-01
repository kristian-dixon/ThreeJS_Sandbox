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

    float impactAngle = dot(normalize(position), impactNormal);
    impactAngle = 1.0 - clamp(impactAngle, 0.0,1.0);

    float impact = pow(cos(PI * impactAngle / 2.0),3.0);

    distortionStrength = (impact * impactDepth * (1.0 - impactAngle));


    
    distortedPosition += impactNormal * distortionStrength;
    


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