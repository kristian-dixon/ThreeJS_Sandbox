import * as THREE from 'three';

import PaintShaderVert from "../../../demos/whiteboard/shaders/paintbrush.vs"
import PaintShaderFrag from "../../../demos/whiteboard/shaders/paintbrush.fs"

export class PaintableTexture
{
    RenderTarget: THREE.WebGLRenderTarget;
    PaintMaterial: THREE.Material;

    constructor(rtWidth:number, rtHeight: number){
        this.RenderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight);
        this.RenderTarget.texture.generateMipmaps = false;
        //this.renderTarget.texture.magFilter = THREE.NearestFilter;
        //this.renderTarget.texture.minFilter = THREE.NearestFilter;
        this.RenderTarget.samples = 1;

        this.PaintMaterial = new THREE.ShaderMaterial({
            uniforms: {
                brushPos: {value: new THREE.Vector3(0,0,0)},
                color: {value: new THREE.Vector3(1,1,1)}
            },
            vertexShader: PaintShaderVert,
            fragmentShader: PaintShaderFrag,
            // depthTest: false,
            // depthWrite: false
            side:THREE.DoubleSide,
            //precision: "highp",
            transparent:true
        });
    }

    Paint(renderer:THREE.WebGLRenderer, camera:THREE.Camera, root:THREE.Object3D, brushPosition:THREE.Vector3)
    {
        this.PaintMaterial["uniforms"].brushPos.value = brushPosition;
        renderer.autoClearColor = false;
        renderer.setRenderTarget(this.RenderTarget);
        
        
        root.traverse(child=>{
            if(child instanceof THREE.Mesh)
            {
                if(child.material as THREE.Material){
                    child["RenderMaterialBackup"] = child.material;
                    child.material = this.PaintMaterial;
                }

                if(child.material as THREE.Material[])
                {
                    for(let i = 0; i < child.material.length;i++)
                    {
                        child["RenderMaterialBackup-"+i] = child.material[i];
                        child.material[i] = this.PaintMaterial;
                    }
                }
            }
        })

        renderer.render(root, camera);

        // this.renderer.setRenderTarget(this.lowResRenderTarget);
        // this.renderer.render(this.blitQuad,this.camera)
        root.traverse(child=>{
            if(child instanceof THREE.Mesh)
            {
                if(child.material as THREE.Material){
                    child.material = child["RenderMaterialBackup"];
                }

                if(child.material as THREE.Material[])
                {
                    for(let i = 0; i < child.material.length;i++)
                    {
                        child.material[i] = child["RenderMaterialBackup-"+i];
                    }
                }
            }
        })

        renderer.setRenderTarget(null);
        renderer.autoClearColor = true;
    }
}