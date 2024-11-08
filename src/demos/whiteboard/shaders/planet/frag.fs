uniform sampler2D uMap;
uniform sampler2D uGradient;
varying vec2 vUv;


vec4 toLinear(vec4 sRGB)
{
    bvec3 cutoff = lessThan(sRGB.rgb, vec3(0.04045));
    vec3 higher = pow((sRGB.rgb + vec3(0.055))/vec3(1.055), vec3(2.4));
    vec3 lower = sRGB.rgb/vec3(12.92);

    return vec4(mix(higher, lower, cutoff), sRGB.a);
}


void main() {
    float terrainHeight = texture2D(uMap, vUv).r;
    

    vec4 color = texture2D(uGradient, vec2(terrainHeight,0.5));

    csm_DiffuseColor = toLinear(color);//vec4(1,color.r,0,0);

    csm_Clearcoat=smoothstep(0.1,0.0,terrainHeight);
}