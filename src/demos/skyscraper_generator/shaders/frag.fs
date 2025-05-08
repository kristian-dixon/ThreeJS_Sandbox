varying vec2 vUv;
varying vec3 vObjNormal;
varying vec4 vMetadata;

uniform sampler2D interiorMap;

float random(vec2 st) {
    return fract(sin(dot(st.xy,
        vec2(12.9898, 78.233))) *
        43758.5453123);
}

void main() {
    
    vec4 colour = vec4(1,1,1,1);

    float y = (vUv.y - vMetadata.w) / vMetadata.z;
    float width = mix(vMetadata.x, vMetadata.y, y);
    float x = (vUv.x+width)/(width*2.0);
    
    float wpf = 8.0;
    vec2 uv = fract(vec2(x,y) * wpf);
    float rng = random(floor(vec2(x,y)*wpf+vec2(floor(vMetadata.w))));
    uv = (uv*2.0)-1.0;
    uv = abs(uv);
    
    float windowSurface = smoothstep(0.5, 0.48, uv.x) * smoothstep(0.5, 0.48, uv.y) * (1.0-vObjNormal.y);
 
    vec3 surfaceColour = vec3(1.0,1.0,1.0) * 0.1;
    surfaceColour *= (1.0-(smoothstep(0.7,0.6,uv.x) * smoothstep(0.7,0.6,uv.y))) * (1.0-vObjNormal.y);
    
    vec3 windowColour = vec3(0.9) * pow(rng,2.0);

    csm_DiffuseColor = vec4(mix(surfaceColour, windowColour, windowSurface),1.0);
    csm_Emissive = windowColour * windowSurface * 0.8;
    csm_Roughness =  1.0-(windowSurface);
    csm_Metalness = 0.0;
}