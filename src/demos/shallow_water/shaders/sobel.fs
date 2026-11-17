varying vec2 vUv;
uniform sampler2D map;
uniform vec2 texelSize;

void main()	{
    vec4 vKernel = 
          texture2D(map, vUv + vec2(-texelSize.x, -texelSize.y))
        + texture2D(map, vUv + vec2(-texelSize.x, 0)) * 2.0
        + texture2D(map, vUv + vec2(-texelSize.x, texelSize.y))
        - texture2D(map, vUv + vec2(texelSize.x, -texelSize.y))
        - texture2D(map, vUv + vec2(texelSize.x, 0)) * 2.0
        - texture2D(map, vUv + vec2(texelSize.x, texelSize.y));

    vec4 hKernel = 
          texture2D(map, vUv + vec2(-texelSize.x, -texelSize.y))
        + texture2D(map, vUv + vec2(0, -texelSize.y)) * 2.0
        + texture2D(map, vUv + vec2(texelSize.x, -texelSize.y))
        - texture2D(map, vUv + vec2(-texelSize.x, texelSize.y))
        - texture2D(map, vUv + vec2(0, texelSize.y)) * 2.0
        - texture2D(map, vUv + vec2(texelSize.x, texelSize.y));

    vec4 col = sqrt(vKernel * vKernel + hKernel * hKernel);

    col.rgb = vec3(col.r * 0.299 + col.g * 0.587 + col.b * 0.114);

    gl_FragColor = col;
    return;
}
