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
    normal = normalize(normal);



    gl_FragColor = vec4(normal/2.0+0.5,1.0);
    return;
}
