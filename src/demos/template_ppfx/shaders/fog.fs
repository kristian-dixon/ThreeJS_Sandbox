// uniform sampler2D map;
// uniform sampler2D normalMap;
// uniform float refractionIndex;
// uniform float refractionIndexR;
// uniform float refractionIndexG;
// uniform float refractionIndexB;
// uniform float strength;
// uniform float normalMapStrength;
// uniform vec3 tint;

varying vec2 vUv;
// varying vec2 screenUv;
// varying vec3 wsNormal;
// varying vec3 wsPos;
// varying vec3 viewDir;
// varying vec3 wsTangent;
// varying vec3 wsBinormal;
// uniform sampler2D backfaceNormals;

void main()	{
    gl_FragColor = vec4(vUv,0,1);
    return;
}
