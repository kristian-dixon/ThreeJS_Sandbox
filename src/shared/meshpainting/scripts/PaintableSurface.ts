import { Camera, Material, Mesh, Object3D, Vector3, WebGLRenderer, WebGLRenderTarget } from "three";

export class PaintableSurface
{
    //A paintable surface is defined as:
    // - A list of meshes that can be painted on
    // - A list of clones that will be rendered during the painting process
    // - The high definition render texture
    // - The low definition render texture (for masking cracks)
    
    meshes:{original: Mesh,clone:Mesh}[] = [];
    renderTarget: WebGLRenderTarget;
    lowResRenderTarget: WebGLRenderTarget;

    constructor(width:number, height:number, scaleFactor:number){
        this.renderTarget = new WebGLRenderTarget(width, height);
        this.renderTarget.texture.generateMipmaps = false;
        
        this.lowResRenderTarget = new WebGLRenderTarget(width/scaleFactor,height/scaleFactor);
        this.lowResRenderTarget.texture.generateMipmaps = false;
    }

    addMesh(mesh:Mesh){
        if(this.meshes.find(x=>x.original == mesh)){
            return;
        }

        let pair = {original:mesh, clone:mesh.clone(false)};
        this.meshes.push(pair);
    }
}

export class PaintableObject
{ 
    surfaces:Map<string, PaintableSurface> = new Map();

    constructor(mesh:Object3D){
        mesh.traverse((child:Object3D)=>{
            if(child instanceof Mesh){
                this.SetupPaintableSurface(child);
            }
        })

        //create materials
    }

    SetupPaintableSurface(surface: Mesh){
        surface.material
    }

    draw(position:Vector3, renderer:WebGLRenderer, camera:Camera){
        this.surfaces.forEach((value,key)=>{
            //set render targets
            //foreach clone
                //update material
                //update postiion
                //render
            //unset render targets
        })
    }
}