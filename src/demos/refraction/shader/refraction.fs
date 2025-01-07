uniform sampler2D map;
uniform sampler2D normalMap;
uniform float refractionIndex;
uniform float strength;
varying vec2 vUv;
varying vec2 screenUv;
varying vec3 wsNormal;
varying vec3 wsPos;
varying vec3 viewDir;
varying vec3 wsTangent;
varying vec3 wsBinormal;

void main()	{
    vec3 unpackedNormals = (texture2D(normalMap, vUv ).xyz * 2.0) - 1.0;
    unpackedNormals *= vec3(0.02,0.02,1.0);
    vec3 normal = unpackedNormals.x * wsTangent + unpackedNormals.y * wsBinormal + unpackedNormals.z * wsNormal;
    normal = normalize(normal);


    vec3 viewDir1 = (viewMatrix * vec4(wsPos-cameraPosition,0.0)).xyz;
    vec3 refraction = refract(normalize(viewDir), normalize(normal), refractionIndex);

    gl_FragColor = textureLod(map, screenUv + refraction.xy * strength, 8.0);
    //gl_FragColor = vec4(normalize(viewDir1),1.0);
    return;
}
