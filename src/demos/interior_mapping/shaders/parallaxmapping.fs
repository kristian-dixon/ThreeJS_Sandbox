varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec3 vViewDir;

uniform float time;
uniform float ZOffset;
uniform vec2 uvOffset;
uniform vec2 uvScale;

uniform float reflBias;
uniform float reflScale;
uniform float reflPower;

//uniform sampler2D testTexture;
uniform samplerCube reflectCube;
uniform samplerCube tCube;
uniform sampler2D dispTex;
uniform sampler2D stainedGlass;

uniform float displacementStrength;
uniform float displacementScale;

vec3 ParralaxMap(){
    vec2 uv = (fract((vUv * uvScale) + uvOffset) - vec2(0.5)) * (2.0);

    vec3 pos = vec3(uv, ZOffset);

    vec3 noise = (texture2D(dispTex, vUv * displacementScale).xyz * 2.0 - 1.0) * displacementStrength;
    //Get how much along each axis we need to travel along the view direction to intersect with
    //an axis aligned voxel grid.
    vec3 invDir = 1.0 / normalize(vViewDir + noise);
    vec3 viewSign = sign(invDir);

    //Figure out where we actually are in this voxel grid based on the resolved position
    vec3 distToAxisBorder = abs(invDir) - pos * invDir;
    //Get closest intersection with border
    float dist = min(distToAxisBorder.x, min(distToAxisBorder.y, distToAxisBorder.z));
    pos += normalize(vViewDir + noise) * dist;

    pos = vec3(
        dot(vTangent, pos),
        dot(vBinormal, pos),
        dot(vNormal, pos)
    );


#ifdef OUTPUT_RED
    return vec3(1,0,0);
#endif

    //return textureCube(tCube, vec3(-pos.z, pos.y * 1.5, pos.x)).rgb;
    return textureCube(tCube, vec3(-pos.x, pos.y, -pos.z)).rgb;
    

    //return textureCube(tCube, pos).rgb;
}


void main()	{
    //Center the Coordinates of the uv
    
    vec3 noise = (texture2D(dispTex, vUv * displacementScale).rgb * 2.0 - 1.0) * displacementStrength;

    

    vec3 refl = reflect(vViewDir, vNormal);
    refl = vec3(refl.z, refl.y, -refl.x);

    float reflectionStrength = (reflBias + reflScale * pow(dot(normalize(vViewDir), normalize(vTangent)), reflPower));
    reflectionStrength = clamp(reflectionStrength, 0.0,1.0);

    vec3 outputCol = mix(textureCube(reflectCube, refl.xyz + noise.xyz).rgb, ParralaxMap() * 2.0, reflectionStrength);
    
    
    #ifdef TINT_TEXTURE
        gl_FragColor = vec4(outputCol,1.0) * texture2D(stainedGlass, vUv * 3.0);
    #else
        gl_FragColor = vec4(outputCol,1.0);
    #endif


    

   
    return;
}
