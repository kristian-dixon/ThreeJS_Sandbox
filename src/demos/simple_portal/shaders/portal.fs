precision highp float;

varying vec2 vUv;




uniform sampler2D mainTex;
uniform sampler2D foamTex;
uniform sampler2D displacementTex;

uniform float displacementStrength;
uniform vec2 displacementUVScale;
uniform vec2 scrollDirection;
uniform float time;



void main()	{ 
    vec4 background = texture2D(mainTex, vUv) * vec4(0.2,0.8,0.4,1.0);

    vec2 scrolledUv = (vUv * displacementUVScale) + scrollDirection * time;
    vec2 dispUv = (2.0 * texture2D(displacementTex, scrolledUv).xy) - 1.0;
    dispUv *= displacementStrength;

    vec4 foam = texture2D(foamTex, (vUv) + dispUv);

    vec4 outputCol = background * 1.0 + foam * vec4(0.2,0.8,0.7,1.0);
    gl_FragColor = vec4(outputCol.rgb, 1.0);
}
