import DemoBase from "../../SceneBase";
import { OrbitalCamera } from "../../shared/generic_scene_elements/camera";
import { DefaultLighting } from "../../shared/generic_scene_elements/lighting";
import * as THREE from 'three';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader"
import TestModel from "./models/CustomAttributesTest.glb"

export class TreeDemo extends DemoBase
{
    scene: THREE.Scene;
    camera: OrbitalCamera;

    initialize(options?: any) 
    {
        this.scene = new THREE.Scene();
        DefaultLighting.SetupDefaultLighting(this.scene, 0.0);
        this.camera = new OrbitalCamera(70,0.01,10.0,this.renderer);

        let loader = new GLTFLoader();
        loader.load(TestModel, (gltf)=>{
            let scene = gltf.scene;
            this.scene.add(scene.clone());

            scene.traverse(x=>{
                if(x instanceof THREE.Mesh)
                {
                    let geo = x.geometry as THREE.BufferGeometry;
                    console.log(geo.getAttribute("Dignus"));
                }
            })
        })
    }

    update(options?: any): void {
        super.update(options);
        this.renderer.render(this.scene, this.camera);
    }


}