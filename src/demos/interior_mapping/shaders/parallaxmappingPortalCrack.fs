varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec3 vViewDir;
varying vec3 vWsViewDir;

uniform float time;
uniform float ZOffset;
uniform vec2 uvOffset;
uniform vec2 uvScale;

uniform float reflBias;
uniform float reflScale;
uniform float reflPower;

//uniform sampler2D testTexture;
uniform samplerCube reflectCube;
uniform sampler2D tCube;
uniform sampler2D dispTex;
uniform sampler2D crack;
uniform sampler2D windowPallet;

uniform float displacementStrength;
uniform float displacementScale;

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

vec3 ParralaxMap(vec3 viewDir, float seed){
    vec2 uv = (fract((vUv) ) * 2.0 - 1.0) * 0.1;

    vec3 pos = vec3(uv, 0);

    #ifdef SHOW_NEAR_SURFACE_HIT_POS
        return pos * vec3(1.,1.,0.);
    #endif


    //Get how much along each axis we need to travel along the view direction to intersect with
    //an axis aligned voxel grid.
    vec3 invDir = 1.0 / (viewDir+vec3(0.000001));

    //Figure out where we actually are in this voxel grid based on the resolved position
    vec3 distToAxisBorder = abs(invDir) - pos * invDir;
    #ifdef SHOW_DIST_TO_AXIS_BORDER
        return 0.2*(distToAxisBorder);
    #endif

   

    //Get closest intersection with border
    float dist = min(distToAxisBorder.x, min(distToAxisBorder.y, distToAxisBorder.z));
    
    #ifdef SHOW_MIN_DIRECTION
    if(distToAxisBorder.x == dist)
        return vec3(1,0,0);

    if(distToAxisBorder.y == dist)
        return vec3(0,1,0);

    if(distToAxisBorder.z == dist)
        return vec3(0,0,1);
    #endif

    #ifdef SHOW_MIN_DIST
        return (vec3(dist, dist,dist)*0.5);
    #endif

    pos += viewDir * dist;
    //pos.z *= 0.75;

    #ifdef SHOW_FINAL_POS
        return pos;
    #endif

    pos = vec3(
     dot(vTangent, pos),
     dot(vBinormal, pos),
     dot(vNormal, pos)
    );
    
    float rotation = 1.5707 * 2.0; //1.5707 * 45.0 ;
    mat3 matrix = mat3(cos(rotation), 0, -sin(rotation),  0, 1, 0, sin(rotation), 0, cos(rotation));

    vec2 sampleCoords = vec2(0.0,0.0);

    pos = matrix * vec3(pos.x, pos.y, pos.z);
    pos = normalize(pos);
    sampleCoords.x= (atan(pos.x, pos.z) + 3.1415) / (3.1415 * 2.0);
    sampleCoords.y = 1.0-(acos(pos.y) / 3.1415);


    float fog = 1.0;//pow(1.0/(dist), 2.0);

    return texture2D(tCube, sampleCoords).rgb * fog;
    //return textureCube(tCube, matrix * vec3(pos.x, pos.y, pos.z)).rgb;
}


void main()	{ 
    vec3 viewDir = vViewDir;

    float seed = random(floor(vUv));

    #ifdef DISABLE_RNG
    seed = 0;
    #endif

  
    vec4 windowSettings = texture2D(windowPallet, vec2(seed, time));

    float displacementModifier = 0.025;
    #ifdef FORCE_DISPLACEMENT_ENABLE
        displacementModifier = displacementStrength;
    #endif

    vec3 normalMap = (texture2D(dispTex, vUv * 5.0 + vec2(time*2.0)).rgb * 2.0 - 1.0) * displacementModifier;
    #ifdef DISABLE_NORMAL_MAP 
        normalMap *= 0;
    #endif
    viewDir = normalize(viewDir);// + normalMap);

    vec3 wsViewDir = normalize(vWsViewDir+normalMap);
    
    vec3 refl = reflect(wsViewDir, vNormal);
    float reflectionStrength = (reflBias + reflScale * pow(dot((-wsViewDir), normalize(vNormal)), reflPower));
    reflectionStrength = clamp(reflectionStrength, 0.0,1.0); 
    vec3 reflectionColour = textureCube(reflectCube, refl.xyz).rgb;
    vec3 interiorColour = ParralaxMap(viewDir,seed);
    vec3 outputCol = interiorColour;//mix(reflectionColour, interiorColour, reflectionStrength);
    
    //   gl_FragColor = vec4(interiorColour, 1.0);
    // return;

    #ifdef FORCE_OUTPUT_INTERIOR
      gl_FragColor = vec4(interiorColour, 1.0);

    #endif

    #ifdef FORCE_OUTPUT_REFLECTION_STRENGTH
        gl_FragColor = vec4(reflectionStrength.rrr, 1.0);
    #endif

    #ifdef FORCE_DISABLE_DAY_NIGHT
        gl_FragColor = vec4(mix(reflectionColour, interiorColour * 2.0, reflectionStrength),1.0);
    #endif


    float crack = 1.0 - texture2D(crack, vUv + normalMap.xy * 0.30).r;
    crack = pow(crack, 4.0);
    float pTime = min(time * 2.0 - 0.1, 0.9);

    if(pTime < crack)
         discard;

    gl_FragColor = mix(vec4(outputCol,1.0), vec4(0.2412,0.44,0.9459,1)*5.0, smoothstep(crack + 0.05, crack - 0.02, pTime));


   //gl_FragColor =  vec4(ParralaxMap(viewDir),1.0);
   //gl_FragColor =  vec4((vTangent),1.0);
    
    //gl_FragColor = vec4(floor(vUv) / 10.0, 0.0, 1.0);
   
    return;
}
