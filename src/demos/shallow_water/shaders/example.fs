

varying vec2 vUv;
varying vec2 vScreenUV;

uniform sampler2D MainTex;
uniform sampler2D FlowMap;
uniform float FlowUVScale;
uniform float DispStrength;
uniform float Time;


void main()	{ 
    vec2 displacement = texture2D(FlowMap, vUv * FlowUVScale + vec2(Time, Time)).xy * 2.0 - 1.0; 

    vec2 displacedUv = vScreenUV + displacement * DispStrength;    

    

    vec3 baseCol = texture2D(MainTex, displacedUv).xyz;
    vec3 col = baseCol * vec3(0.5, 0.6, 0.8);

    gl_FragColor = vec4(col,1.0);
    return;
}
