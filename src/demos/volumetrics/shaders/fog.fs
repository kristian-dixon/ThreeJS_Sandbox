varying vec2 vUv;
varying vec3 vRayDir;

struct LightParams
{
    vec3 dir;
    vec3 color;
};

uniform vec3 cameraPos;

// xyz position, w radius
uniform vec4 sphereParams;
uniform float absorbtionCoefficent;

uniform float stepDistance;

uniform LightParams light;

void sphereIntersection(vec3 ro, vec3 rd, vec4 sphereInfo, out float t0, out float t1)
{
    vec3 rayToSphere = sphereInfo.xyz - ro;
    float closestPointOnRayToSphere = dot(rayToSphere,rd);
    float d2 = dot(rayToSphere, rayToSphere) - (closestPointOnRayToSphere*closestPointOnRayToSphere);

    float thc = sqrt(sphereInfo.w*sphereInfo.w - d2); 
    t0 = max(0.0,closestPointOnRayToSphere-thc);
    t1 = max(0.0,closestPointOnRayToSphere+thc);
}

void main()	{
    vec2 uv = vUv;
    vec3 ro = cameraPos;
    vec3 rd = normalize(vRayDir);

    float viewIntersectionNear = 0.0;
    float viewIntersectionFar = 0.0;
    sphereIntersection(ro,rd,sphereParams,viewIntersectionNear, viewIntersectionFar);

    float distTravelledThroughVolume = abs(viewIntersectionFar-viewIntersectionNear);

    
    float perStepTransparency = exp(-stepDistance * absorbtionCoefficent);

    vec3 lightDirNorm = normalize(light.dir);
    vec3 lightColour = vec3(0,0,0);
    float transmission = 1.0;
    //Inscattering
    for(float i = viewIntersectionNear; i < viewIntersectionFar - stepDistance * 0.5; i+=stepDistance)
    {
        if(transmission < 0.001){
            break;
        }

        vec3 samplePoint = ro + rd * (i + stepDistance * 0.5);

        float t0 = 0.0; float t1 = 0.0;

        transmission *= perStepTransparency;

        sphereIntersection(samplePoint, lightDirNorm, sphereParams, t0,t1);

        
        float lightAttenuation = exp(-t1 * absorbtionCoefficent);
        lightColour += transmission * light.color * lightAttenuation * stepDistance;
    }

    

    transmission = exp(-distTravelledThroughVolume * absorbtionCoefficent);
    vec3 backgroundColor = mix(vec3(0.6,0.7,1.0), vec3(0.3,0.45,0.9), 1.0-pow(1.0-abs(dot(vRayDir,vec3(0,1.0,0.0))),4.0));

    vec3 col = backgroundColor * transmission + lightColour;
    gl_FragColor = vec4(col,1.0);
}
