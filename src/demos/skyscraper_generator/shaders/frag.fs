varying vec2 vUv;
varying vec3 vObjNormal;

void main() {
    
    vec4 colour = vec4(1,1,1,1);

    float light = 0.0;
    vec2 uv = fract((vUv*2.0-1.0) * 5.0);

    csm_DiffuseColor = vec4(uv.xy, 0.0, 1.0);
}