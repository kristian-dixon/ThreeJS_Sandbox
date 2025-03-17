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

uniform sampler2D tCube;
uniform sampler2D crack;

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

    //Get how much along each axis we need to travel along the view direction to intersect with
    //an axis aligned voxel grid.
    vec3 invDir = 1.0 / (viewDir+vec3(0.000001));

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
    
    float rotation = 1.5707 * 2.0; //1.5707 * 45.0 ;
    mat3 matrix = mat3(cos(rotation), 0, -sin(rotation),  0, 1, 0, sin(rotation), 0, cos(rotation));

    vec2 sampleCoords = vec2(0.0,0.0);

    pos = matrix * vec3(pos.x, pos.y, pos.z);
    pos = normalize(pos);
    sampleCoords.x= (atan(pos.x, pos.z) + 3.1415) / (3.1415 * 2.0);
    sampleCoords.y = 1.0-(acos(pos.y) / 3.1415);
    
    return texture2D(tCube, sampleCoords).rgb;
}


void main()	{ 
    vec3 viewDir = vViewDir;

    float seed = random(floor(vUv));
    viewDir = normalize(viewDir);
    vec3 interiorColour = ParralaxMap(viewDir,seed);
    vec3 outputCol = interiorColour;
    
    float crack = 1.0 - texture2D(crack, vUv).r;
    crack = pow(crack, 4.0);
    float pTime = min(time * 2.0 - 0.1, 0.9);

    if(pTime < crack)
         discard;

    gl_FragColor = mix(vec4(outputCol,1.0), vec4(0.2412,0.44,0.9459,1)*5.0, smoothstep(crack + 0.05, crack - 0.02, pTime));
    return;
}
