import * as THREE from "three";
import vs from "./shaders/blit.vs"
import fs from "./shaders/blit.fs"

export class Blitter{
    quad: THREE.Mesh;
    defaultMaterial: THREE.ShaderMaterial;
    
    constructor(){
        this.defaultMaterial = new THREE.ShaderMaterial({
            depthTest: false,
            vertexShader: vs,
            fragmentShader: fs,
            uniforms:{
                map:{value:null}
            }
        })

        this.quad = new THREE.Mesh(new THREE.PlaneGeometry(), this.defaultMaterial);
    }

    blit(src:THREE.Texture, dst: THREE.WebGLRenderTarget, renderer: THREE.WebGLRenderer, camera:THREE.Camera, material?: THREE.Material){
        let originalRenderTarget = renderer.getRenderTarget();
        if(material)
        {
            this.quad.material = material;
        }

        (this.quad.material as THREE.ShaderMaterial).uniforms["map"].value = src;
        renderer.setRenderTarget(dst);
        renderer.render(this.quad, camera);

        this.quad.material = this.defaultMaterial;

        renderer.setRenderTarget(originalRenderTarget);
    }

    copyToActiveRenderTarget(src:THREE.Texture, renderer: THREE.WebGLRenderer, camera:THREE.Camera, material?: THREE.Material){
        if(material)
        {
            this.quad.material = material;
        }

        (this.quad.material as THREE.ShaderMaterial).uniforms["map"].value = src;

        renderer.render(this.quad, camera);

        this.quad.material = this.defaultMaterial;
    }
}