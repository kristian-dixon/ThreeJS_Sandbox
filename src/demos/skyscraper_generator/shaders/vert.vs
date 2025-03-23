varying vec2 vUv;
varying vec3 vObjNormal;
varying vec4 vMetadata;

attribute vec4 metadata;

void main() {
    vUv = uv;
    vObjNormal = normal;
    vMetadata = metadata;
}   