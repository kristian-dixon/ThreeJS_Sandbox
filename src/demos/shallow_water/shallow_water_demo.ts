import DemoBase from "../../SceneBase";
import { OrbitalCamera } from "../../shared/generic_scene_elements/camera";
import { DefaultLighting } from "../../shared/generic_scene_elements/lighting";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader"
import ExampleModel from "./models/ShallowWaterTest.glb"
import ExampleTexture from "../../shared/assets/textures/placeholder/Sweep.jpg"

import vertexShader from "./shaders/example.vs"
import fragShader from "./shaders/example.fs"
import EnvironmentMap from "../../shared/assets/textures/skyboxes/medieval_cafe_1k.hdr"

import { Color, DoubleSide, EquirectangularReflectionMapping, Mesh, Scene, ShaderMaterial, TextureLoader, Vector2, Vector3, WebGLRenderTarget } from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { Blitter } from "../../shared/blitter/blit";
import { ScreenspaceRenderTarget } from "../../shared/generic_scene_elements/screenspace_rendertarget";

export class ShallowWater extends DemoBase
{
    opaqueScene: Scene;
    transparentScene: Scene;
    blitter: Blitter;
    camera: OrbitalCamera;

    opaquePassResult:ScreenspaceRenderTarget;

    materialUniforms = {
        MainTex:{value:null}
    }

    initialize(options?: any) 
    {
        let self = this;
        this.opaqueScene = new Scene();
        this.transparentScene = new Scene();
        this.blitter = new Blitter();

        this.opaquePassResult = new ScreenspaceRenderTarget(new Vector2(1,1));

        DefaultLighting.SetupDefaultLighting(this.opaqueScene, 0.0);
        this.camera = new OrbitalCamera(70,0.01,100.0,this.renderer);
        this.camera.setTarget(new Vector3(0,0,-5))

        let hdri = new RGBELoader().load(EnvironmentMap, (tex)=>{
            hdri.mapping = EquirectangularReflectionMapping
            this.opaqueScene.background = hdri;
            this.opaqueScene.environment = hdri;
        })

        let material = new ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragShader,
            side:DoubleSide,
            uniforms:this.materialUniforms
        })

        let loader = new GLTFLoader();
        loader.load(ExampleModel, (gltf)=>{
            let scene = gltf.scene;

            scene.traverse(x=>{
                if(x instanceof Mesh)
                {
                    x.position.setY(-0.5)
                    x.position.setZ(-5.0);
                    
                    if(x.name === "Water")
                    {
                        x.material = material;
                        self.transparentScene.add(x.clone(true));
                    }
                    else
                    {
                        self.opaqueScene.add(x.clone(true));    
                    }
                }
            })

            //this.opaqueScene.add(scene.clone());
        })

        this.materialUniforms.MainTex.value = this.opaquePassResult.texture;
    }

    update(options?: any): void {
        super.update(options);
        this.renderer.setRenderTarget(this.opaquePassResult.renderTarget);
        this.renderer.render(this.opaqueScene, this.camera);
        this.renderer.autoClear = false;

        this.renderer.setRenderTarget(null);
        this.blitter.copyToActiveRenderTarget(this.opaquePassResult.renderTarget.texture, this.renderer, this.camera)

        this.renderer.render(this.transparentScene, this.camera);
        this.renderer.autoClear = true;
    }


}