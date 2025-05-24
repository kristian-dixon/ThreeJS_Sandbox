precision highp float;


varying vec2 vUv;
varying vec3 norm;

uniform sampler2D MainTex;


void main()	{ 
    
    float lit = dot(normalize(norm), normalize(vec3(1.0,-1.0,1.0))) * 0.5 + 0.5;


    
    vec3 col =  mix(vec3(0.2,0.15,0.41), vec3(0.3,1.0,0.2), lit);
    
    // vec4 tex = texture2D(MainTex, fract(vUv * vec2(1,-1))).rgba;

    // if(tex.g < 0.12) {
    //     discard;
    // }

    gl_FragColor = vec4(col.rgb,1.0);




    return;
}
