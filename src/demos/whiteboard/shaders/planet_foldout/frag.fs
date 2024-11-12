varying vec2 vUv;
uniform sampler2D uMap;
uniform sampler2D uGradient;


void main(){
    float terrainHeight = texture2D(uMap, vUv).r;
    gl_FragColor = texture2D(uGradient, vec2(terrainHeight,0.5));

#ifdef OUTPUT_HEIGHTMAP
    gl_FragColor = vec4(terrainHeight.rrr,1.0);
    return;
#endif

    return;
}