import DemoBase from "../../SceneBase";
import { OrbitalCamera } from "../../shared/generic_scene_elements/camera";
import { DefaultLighting } from "../../shared/generic_scene_elements/lighting";
import * as THREE from 'three';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader"
import TestModel from "./models/Tree.glb"

import vertexShader from "./shaders/tree.vs"
import fragShader from "./shaders/tree.fs"

import leafTex from "./models/Image_6.png"

export class TreeDemo extends DemoBase
{
    scene: THREE.Scene;
    camera: OrbitalCamera;

    materialUniforms = {
        MainTex:{value:null}
    }

    initialize(options?: any) 
    {
        this.scene = new THREE.Scene();
        DefaultLighting.SetupDefaultLighting(this.scene, 0.0);
        this.camera = new OrbitalCamera(70,0.01,1000.0,this.renderer);
        

        let material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragShader,
            side:THREE.DoubleSide,
            uniforms:this.materialUniforms
        })

        let loader = new GLTFLoader();
        loader.load(TestModel, (gltf)=>{
            let scene = gltf.scene;

            gltf.scene.position.setZ(-5.0);

            scene.traverse(x=>{
                if(x instanceof THREE.Mesh)
                {
                    
                    if((x.geometry as THREE.BufferGeometry).hasAttribute("_bushynormal"))
                    {
                        x.material = material;
                    }

                    console.log(x.geometry);
                }
            })

            this.scene.add(scene.clone());

            
        })

        let textureLoader = new THREE.TextureLoader();
        textureLoader.load(leafTex, (tex)=>{
            this.materialUniforms.MainTex.value = tex;
        })

        this.scene.background = new THREE.Color("red")
    }

    update(options?: any): void {
        super.update(options);
        this.renderer.render(this.scene, this.camera);
    }


}