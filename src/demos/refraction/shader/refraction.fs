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
uniform sampler2D backfaceNormals;

void main()	{
    vec3 unpackedNormals = (texture2D(normalMap, vUv ).xyz * 2.0) - 1.0;
    unpackedNormals *= vec3(normalMapStrength,normalMapStrength,1.0);
    vec3 normal = unpackedNormals.x * wsTangent + unpackedNormals.y * wsBinormal + unpackedNormals.z * wsNormal;
    normal = normalize(normal);


    vec3 viewDir1 = normalize(viewDir);

    vec3 refractionR = refract(viewDir1, (normal), refractionIndexR);
    vec3 rBackNormal = texture2D(backfaceNormals, screenUv + refractionR.xy * strength).rgb * 2.0 - 1.0;
    vec3 rBackRefraction = refract(viewDir1, (rBackNormal), refractionIndexR);
    vec3 resultTest = texture2D(map, screenUv + refractionR.xy * strength + rBackRefraction.xy * strength).rgb;

    vec3 refractionG = refract((viewDir1), (normal), refractionIndexG);
    float g = texture2D(map, screenUv + refractionG.xy * strength).g;

    vec3 refractionB = refract((viewDir1), (normal), refractionIndexB);
    float b = texture2D(map, screenUv + refractionB.xy * strength).b;

    gl_FragColor = vec4(resultTest,1.0);//vec4(r,g,b,1.0) * vec4(tint,1.0);
    return;
}
