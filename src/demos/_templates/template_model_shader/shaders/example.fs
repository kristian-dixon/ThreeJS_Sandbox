precision highp float;


varying vec2 vUv;

uniform sampler2D MainTex;


void main()	{ 
    vec3 col = texture2D(MainTex, vUv).xyz;
    gl_FragColor = vec4(col.rgb,1.0);
    return;
}
