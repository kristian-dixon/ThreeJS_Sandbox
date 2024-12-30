varying vec2 vUv;
uniform float Time;
uniform sampler2D mainTex;
uniform sampler2D dispTex;

uniform float displacementStr; // 0.3; 
uniform float verticalStrength; // 2.0
uniform vec2 scrollSpeed; // 0.4,-1
uniform vec2 displacementUVScale;


vec4 toLinear(vec4 sRGB)
{
    bvec3 cutoff = lessThan(sRGB.rgb, vec3(0.04045));
    vec3 higher = pow((sRGB.rgb + vec3(0.055))/vec3(1.055), vec3(2.4));
    vec3 lower = sRGB.rgb/vec3(12.92);

    return vec4(mix(higher, lower, cutoff), sRGB.a);
}

vec4 toGamma(vec4 color) {
    return vec4(pow(color.xyz, vec3(1.0 / 2.2)), color.w);
}



void main()	{
    vec2 uvScrolled = (vUv * displacementUVScale) + scrollSpeed * Time;
    vec2 disp = texture2D(dispTex, uvScrolled).xy;

    float gradient = pow(vUv.y + 0.001,verticalStrength);
    #ifdef OUTPUT_GRADIENT
        gl_FragColor = vec4(gradient, 0.0,0.0,1);
        return;
    #endif


    disp = ((disp * 2.0) - 1.0) * displacementStr * gradient;

    vec4 color = texture2D(mainTex, vUv + disp);
   
    gl_FragColor = color * 2.0;// toGamma( color );
    return;
}
