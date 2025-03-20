varying vec2 vUv;

void main() {
    
    vec4 colour = vec4(1,1,1,1);

    float light = 0.0;
    float2 uv = vUv * 2.0 - 1.0;
    

    csm_DiffuseColor = vec4(vUv.xy, 0.0, 1.0);
}