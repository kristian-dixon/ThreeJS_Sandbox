varying vec2 vUv;
varying mat3 vTBN;
varying vec3 vViewDir;

uniform sampler2D normalMap;

vec3 hsvToRgb(vec3 hsv)
{
    vec4 k = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(hsv.xxx + k.xyz) * 6.0 - k.www);

    return hsv.z * mix(k.xxx, clamp(p-k.xxx, 0.0, 1.0), hsv.yyy);
}

void main()	
{ 
    vec3 normal = texture2D(normalMap, vUv * 5.0).xyz;
    normal = (normal * 2.0 - 1.0);
   
    normal = normalize(vTBN * normal);

    float fresnel = abs(dot(normal,normalize(vViewDir)));
    float alpha = pow(1.0 - pow(fresnel, 2.0), 1.15) * 0.5;
    vec3 color = hsvToRgb(vec3(acos(fresnel), 0.8, 1.0));


    gl_FragColor = vec4(color * 2.0,alpha);
    
   
    return;
}
