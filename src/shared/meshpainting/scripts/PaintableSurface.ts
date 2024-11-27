import * as THREE from 'three';

import PaintShaderVert from "../../../demos/whiteboard/shaders/paintbrush.vs"
import PaintShaderFrag from "../../../demos/whiteboard/shaders/paintbrush.fs"

export class PaintableTexture
{
    RenderTarget: THREE.WebGLRenderTarget;
    PaintMaterial: THREE.Material;
    brushColor= 0xffffff;

    blitMaterial: THREE.Material;
    quad: THREE.Mesh;

    Settings = {
        brushPos: {value: new THREE.Vector3(0,0,0)},
        color: {value: new THREE.Color(255,255,255)},
        blendStrength: {value: 0.1},
        brushRadius: {value: 0.1},
        brushFalloff: {value: 0.5}
    }

    constructor(rtWidth:number, rtHeight: number){
        this.RenderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight);
        this.RenderTarget.texture.generateMipmaps = false;
        //this.renderTarget.texture.magFilter = THREE.NearestFilter;
        //this.renderTarget.texture.minFilter = THREE.NearestFilter;
        this.RenderTarget.samples = 1;

        this.PaintMaterial = new THREE.ShaderMaterial({
            uniforms:this.Settings,
            vertexShader: PaintShaderVert,
            fragmentShader: PaintShaderFrag,
            depthTest: false,
            depthWrite: false,
            side:THREE.DoubleSide,
            transparent:true
        });

        this.blitMaterial =  new THREE.ShaderMaterial({
            uniforms:{
                uMap:{value:null}
            },
            vertexShader:PaintShaderVert,
            fragmentShader:
            `
                varying vec2 vUv;
                uniform sampler2D uMap;
                              
                void main(){
                    gl_FragColor = vec4(texture2D(uMap, vUv).xyz,1.0);
                    return;
                }
            `,
            depthTest: false,
            depthWrite: false,
            side:THREE.DoubleSide,
            transparent:true
        });
        this.quad = new THREE.Mesh(new THREE.PlaneGeometry(),this.blitMaterial)
    }

    Paint(renderer:THREE.WebGLRenderer, camera:THREE.Camera, root:THREE.Object3D, brushPosition:THREE.Vector3)
    {
        this.PaintMaterial["uniforms"].brushPos.value = brushPosition;
        renderer.autoClearColor = false;
        renderer.setRenderTarget(this.RenderTarget);
        
        if(this.dirty)
        {
            renderer.render(this.quad, camera);
            this.dirty = false;
        }
        
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

    SetColor(color:THREE.ColorRepresentation){
        this.PaintMaterial["uniforms"].color.value = new THREE.Color(color);
    }

    SetBlendStrength(strength: number)
    {
        this.PaintMaterial["uniforms"].blendStrength.value = strength;
    }

    SetBrushRadius(radius: number)
    {
        this.PaintMaterial["uniforms"].brushRadius.value = radius;
    }

    SetBrushFalloff(value: number)
    {
        this.PaintMaterial["uniforms"].brushFalloff.value = value;
    }

    SetBlendMode(blendMode:THREE.Blending)
    {
        this.PaintMaterial.blending = blendMode;
        this.PaintMaterial.needsUpdate = true;
    }

    dirty = false;
    Import(renderer:THREE.WebGLRenderer, camera:THREE.Camera, texture: THREE.Texture){     
        (this.blitMaterial as THREE.ShaderMaterial).uniforms.uMap.value = texture;
        (this.blitMaterial as THREE.ShaderMaterial).needsUpdate = true;//.uMap.value = texture;
        (this.blitMaterial as THREE.ShaderMaterial).uniformsNeedUpdate = true;    
        this.dirty = true;
    }

    Export(renderer: THREE.WebGLRenderer){
        // Read the pixel data from the render target
        const pixelBuffer = new Uint8Array(this.RenderTarget.width * this.RenderTarget.height * 4);
        renderer.readRenderTargetPixels(this.RenderTarget, 0, 0, this.RenderTarget.width, this.RenderTarget.height, pixelBuffer);

        // Create a canvas and draw the pixel data onto it
        const canvas = document.createElement('canvas');
        canvas.width = this.RenderTarget.width;
        canvas.height = this.RenderTarget.height;
        const context = canvas.getContext('2d');
        const imageData = context.createImageData(this.RenderTarget.width, this.RenderTarget.height);
        imageData.data.set(pixelBuffer);
        context.putImageData(imageData, 0, 0);

        // Export the canvas as a PNG
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'export.png';
        link.click();
    }
}