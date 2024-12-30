varying vec2 vUv;
varying vec4 vWorldPos;

uniform vec3 brushPos;
uniform vec3 color;

uniform float blendStrength;
uniform float brushRadius;
uniform float brushFalloff;
uniform vec3 velocity;

void main()	{

    vec2 dir = clamp((vWorldPos.xy-brushPos.xy) * 1.0/brushRadius, vec2(-1), vec2(1));
    dir = normalize(dir);// * (1.0 - clamp(length(dir),0.,1.));

    dir = dir * clamp(dot(dir, normalize(velocity.xy)), 0., 1. ) ;

    dir = (dir + 1.0) * 0.5;  

    if(length(velocity) < 0.01)
    {
        discard;
    }

    //dir = vec2(1,0);

    float dist = step(length(vWorldPos.xy-brushPos.xy), brushRadius);
    if(dist - 0.1 < 0.)
    {
        discard;
    }
    gl_FragColor = vec4(dir,0,blendStrength);
    return;
}
