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
uniform samplerCube tCube;
uniform sampler2D dispTex;
uniform sampler2D stainedGlass;
uniform sampler2D windowPallet;

uniform float displacementStrength;
uniform float displacementScale;

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

vec3 ParralaxMap(vec3 viewDir, float seed){
    vec2 uv = fract(vUv) * 2.0 - 1.0;//(fract((vUv * uvScale) + uvOffset) - vec2(0.5)) * (2.0);

    vec3 pos = vec3(uv, ZOffset);

    //Get how much along each axis we need to travel along the view direction to intersect with
    //an axis aligned voxel grid.
    vec3 invDir = 1.0 / viewDir;

    //Figure out where we actually are in this voxel grid based on the resolved position
    vec3 distToAxisBorder = abs(invDir) - pos * invDir;
    //Get closest intersection with border
    float dist = min(distToAxisBorder.x, min(distToAxisBorder.y, distToAxisBorder.z));
    pos += viewDir * dist;

    pos = vec3(
     dot(vTangent, pos),
     dot(vBinormal, pos),
     dot(vNormal, pos)
    );


    
    float rotation = 1.5707 * ((floor(fract(seed) * 16.0)/4.0)*4.0-1.0);
    mat3 matrix = mat3(cos(rotation), 0, -sin(rotation),  0, 1, 0, sin(rotation), 0, cos(rotation));





    return textureCube(tCube, matrix * vec3(pos.x, pos.y, pos.z)).rgb;
    

    //return textureCube(tCube, pos).rgb;
}


void main()	{ 
    vec3 viewDir = vViewDir;

    float seed = random(floor(vUv));

  
    vec4 windowSettings = texture2D(windowPallet, vec2(seed, time));

    vec3 normalMap = (texture2D(dispTex, vUv * displacementScale).rgb * 2.0 - 1.0) * displacementStrength * (1.0 - windowSettings.a);
    viewDir = normalize(viewDir + normalMap);

    vec3 wsViewDir = normalize(vWsViewDir+normalMap);
    vec3 refl = reflect(wsViewDir, vNormal);
    //refl = vec3(refl.z, refl.y, -refl.x);

    float reflectionStrength = (reflBias + reflScale * pow(dot((-wsViewDir), normalize(vNormal)), reflPower));
    reflectionStrength = clamp(reflectionStrength, 0.0,1.0);

    //float reflectionBrightness = 1.0 - abs((time - 0.5) * 2.0);
    
    vec3 reflectionColour = textureCube(reflectCube, refl.xyz).rgb;// * reflectionBrightness;


    vec3 outputCol = mix(reflectionColour, ParralaxMap(viewDir,seed) * max(vec3(0.1,0.1,0.1),windowSettings.rgb) * 2.0, reflectionStrength);
    
    #ifdef TINT_TEXTURE
        gl_FragColor = vec4(outputCol,1.0) * texture2D(stainedGlass, vUv * 3.0);
    #else
        gl_FragColor = vec4(outputCol,1.0) ;
    #endif

   //gl_FragColor =  vec4(ParralaxMap(viewDir),1.0);
   //gl_FragColor =  vec4((vTangent),1.0);
    
    //gl_FragColor = vec4(floor(vUv) / 10.0, 0.0, 1.0);
   
    return;
}
