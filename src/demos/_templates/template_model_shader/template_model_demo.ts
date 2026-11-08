import DemoBase from "../../../SceneBase";
import { OrbitalCamera } from "../../../shared/generic_scene_elements/camera";
import { DefaultLighting } from "../../../shared/generic_scene_elements/lighting";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader"
import ExampleModel from "../../../shared/assets/models/chunkysmooth.glb"
import ExampleTexture from "../../../shared/assets/textures/placeholder/Sweep.jpg"

import vertexShader from "./shaders/example.vs"
import fragShader from "./shaders/example.fs"

import { Color, DoubleSide, Mesh, Scene, ShaderMaterial, TextureLoader, Vector3 } from "three";

export class TemplateModelDemo extends DemoBase
{
    scene: THREE.Scene;
    camera: OrbitalCamera;

    materialUniforms = {
        MainTex:{value:null}
    }

    initialize(options?: any) 
    {
        this.scene = new Scene();
        DefaultLighting.SetupDefaultLighting(this.scene, 0.0);
        this.camera = new OrbitalCamera(70,0.01,100.0,this.renderer);
        this.camera.setTarget(new Vector3(0,0,-5))

        let material = new ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragShader,
            side:DoubleSide,
            uniforms:this.materialUniforms
        })

        let loader = new GLTFLoader();
        loader.load(ExampleModel, (gltf)=>{
            let scene = gltf.scene;

            gltf.scene.position.setY(-0.5)
            gltf.scene.position.setZ(-5.0);

            scene.traverse(x=>{
                if(x instanceof Mesh)
                {
                    x.material = material;
                }
            })

            this.scene.add(scene.clone());
        })

        let textureLoader = new TextureLoader();
            textureLoader.load(ExampleTexture, (tex)=>{
            this.materialUniforms.MainTex.value = tex;
        })

        this.scene.background = new Color("red")
    }

    update(options?: any): void {
        super.update(options);
        this.renderer.render(this.scene, this.camera);
    }


}