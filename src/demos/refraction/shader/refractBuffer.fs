uniform sampler2D map;
uniform sampler2D normalMap;
uniform float refractionIndex;
uniform float refractionIndexR;
uniform float refractionIndexG;
uniform float refractionIndexB;
uniform float strength;
uniform float normalMapStrength;
uniform vec3 tint;

varying vec2 vUv;
varying vec2 screenUv;
varying vec3 wsNormal;
varying vec3 wsPos;
varying vec3 viewDir;
varying vec3 wsTangent;
varying vec3 wsBinormal;

void main()	{
    vec3 unpackedNormals = (texture2D(normalMap, vUv ).xyz * 2.0) - 1.0;
    unpackedNormals *= vec3(normalMapStrength,normalMapStrength,1.0);
    vec3 normal = unpackedNormals.x * wsTangent + unpackedNormals.y * wsBinormal + unpackedNormals.z * wsNormal;
    //normal = normalize(wsNormal);


    vec3 viewDir1 = (viewMatrix * vec4(wsPos-cameraPosition,0.0)).xyz;

    vec3 refractionR = refract(normalize(viewDir), normalize(normal), refractionIndexR);
    float r = texture2D(map, screenUv + refractionR.xy * strength).r;

    vec3 refractionG = refract(normalize(viewDir), normalize(normal), refractionIndexG);
    float g = texture2D(map, screenUv + refractionG.xy * strength).g;

    vec3 refractionB = refract(normalize(viewDir), normalize(normal), refractionIndexB);
    float b = texture2D(map, screenUv + refractionB.xy * strength).b;

    gl_FragColor = vec4(r,g,b,1.0) * vec4(tint,1.0);
    return;
}
