varying vec2 vUv;
uniform sampler2D uMap;
uniform sampler2D uGradient;
uniform float uTime;


void main(){
    //float terrainHeight = texture2D(uMap, vUv).r;
    vec2 uv = vUv ;
    //uv.x *=2.0;
    vec4 texColor = texture2D(uMap, uv);
    float terrainHeight = texColor.r;
    //if(max(uv.x,uv.y)>1.0)
    {
        terrainHeight = textureLod(uMap, fract(uv), mod(uTime,8.0)).r;
    };
    gl_FragColor = texture2D(uGradient, vec2(terrainHeight,0.5));
    

#ifdef OUTPUT_HEIGHTMAP
    gl_FragColor = vec4(terrainHeight.rrr,1.0);
    return;
#endif

#ifdef OUTPUT_RAW_TEXTURE
    gl_FragColor = vec4(0.0,0.0,0.0,1.0) + texColor ;
    return;
#endif

    return;
}