varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec3 vViewDir;

uniform float time;
uniform float ZOffset;
uniform vec2 uvOffset;
uniform vec2 uvScale;

//uniform sampler2D testTexture;
uniform samplerCube tCube;

vec3 ParralaxMap(){
    vec2 uv = (fract((vUv * uvScale) + uvOffset) - vec2(0.5)) * (2.0);

    vec3 pos = vec3(uv, ZOffset);

    //Get how much along each axis we need to travel along the view direction to intersect with
    //an axis aligned voxel grid.
    vec3 invDir = 1.0/ vViewDir;
    vec3 viewSign = sign(invDir);

    //Figure out where we actually are in this voxel grid based on the resolved position
    vec3 distToAxisBorder = abs(invDir) - pos * invDir;
    //Get closest intersection with border
    float dist = min(distToAxisBorder.x, min(distToAxisBorder.y, distToAxisBorder.z));
    pos += vViewDir * dist;

    pos = vec3(
        dot(vTangent, pos),
        dot(vBinormal, pos),
        dot(vNormal, pos)
    );


    return textureCube(tCube, pos).rgb;
}


void main()	{
    //Center the Coordinates of the uv

    gl_FragColor = vec4(ParralaxMap(), 1);
    //gl_FragColor = vec4(vBinormal, 1.0);
    return;



    //gl_FragColor = textureCube(tCube, vDir); //vec4(vNormal, 1); //texture2D(testTexture, vUv);

    //gl_FragColor = texture2D(testTexture, vUv);
}
