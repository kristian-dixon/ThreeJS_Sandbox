varying vec2 vUv;
uniform float Time;
uniform sampler2D mainTex;
uniform sampler2D dispTex;

uniform float displacementStr; // 0.3; 
uniform float verticalStrength; // 2.0
uniform vec2 scrollSpeed; // 0.4,-1

void main()	{
    vec2 uvScrolled = vUv + scrollSpeed * Time;

    vec2 disp = texture2D(dispTex, uvScrolled).xy;

    disp = (disp * 2.0 - 1.0) * displacementStr * pow(vUv.y,verticalStrength);

    gl_FragColor = texture2D(mainTex, vUv + disp);
    //gl_FragColor = vec4(disp,0,1);
    return;
}
