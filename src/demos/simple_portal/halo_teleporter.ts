import DemoBase from "../../SceneBase";
import * as THREE from 'three';

import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader"

import { OrbitalCamera } from "../../shared/generic_scene_elements/camera";
import vertexShader from "./shaders/portal.vs";
import fragmentShader from "./shaders/halo_teleporter.fs";

import dispTex from "../../shared/assets/textures/flow_map/flowmap.png"
import foamTex from "../../shared/assets/textures/placeholder/randomShapes3.png"
import noiseTex from "../../shared/assets/textures/noise/HorribleClouds.png"

import model from "./models/HaloDoor.glb"
import { DefaultLighting } from "../../shared/generic_scene_elements/lighting";
import skybox from "../../shared/assets/textures/skyboxes/tears_of_steel_bridge_2k.jpg";

export class HaloTeleporter extends DemoBase
{
    scene: THREE.Scene;
    camera: OrbitalCamera;

    fogDoorUniforms = 
    {
        mainTex: {value: null},
        noiseTex: {value: null},
        displacementTex: {value:null},
        displacementStrength: {value: 0.49},
        displacementUVScale: {value: new THREE.Vector2(2.4,2.6)},
        scrollDirection: {value: new THREE.Vector2(0,0.22)},
        backgroundColourTint: {value: new THREE.Color(0.05,1.0,0.01)},
        time:{value:0.0}
    }

   

    initialize(options?: any) 
    {
        let quad = new THREE.PlaneGeometry(1,1,32,32);
        //let quad = new THREE.SphereGeometry(0.5,32,32,32);
        quad.computeTangents();
        this.scene = new THREE.Scene();
        this.camera = new OrbitalCamera(70,0.01,10.0,this.renderer);
        this.camera.controls.target = new THREE.Vector3(0,0,-2);

        DefaultLighting.SetupDefaultLighting(this.scene);

        let fogMaterial = new THREE.ShaderMaterial(
            {
                vertexShader:vertexShader,
                fragmentShader:fragmentShader,
                uniforms:this.fogDoorUniforms,
                transparent:true
                //side:THREE.DoubleSide
            }
        );


        let gltfLoader = new GLTFLoader();
        gltfLoader.load(model, (gltf)=>{
            gltf.scene.traverse(x=>{
                if(x instanceof THREE.Mesh)
                {
                    if(x.name == "Portal")
                    {
                        x.material = fogMaterial;
                    }
                }
            })

            this.scene.add(gltf.scene);
        });

        

        let textureLoader = new THREE.TextureLoader();
        textureLoader.load(foamTex, (tex)=>{
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            this.fogDoorUniforms.mainTex.value = tex;
        })

        textureLoader.load(noiseTex, (tex)=>{
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            this.fogDoorUniforms.noiseTex.value = tex;
        })
 

        textureLoader.load(dispTex, (tex)=>{
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            this.fogDoorUniforms.displacementTex.value = tex;
        })

        textureLoader.load(
            skybox,
            (texture) => {
              texture.mapping = THREE.EquirectangularReflectionMapping;
              //;
              if(window.self == window.top)
              {
                this.scene.background = texture
              }

              this.scene.environment = texture;
            });
        

        let matUniforms = this.fogDoorUniforms;
        Object.keys(this.fogDoorUniforms).forEach((key)=>{
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if(matUniforms[key].value instanceof THREE.Texture)
            {
                return;
            }

            if(matUniforms[key].value instanceof THREE.Vector2)
            {
                this.gui.add(matUniforms[key].value, "x").name(key + " x").onChange((x)=>{
               
                });

                this.gui.add(matUniforms[key].value, "y").name(key + " y").onChange((x)=>{
               
                });
                return;
            }

            if(matUniforms[key].value instanceof THREE.Color)
            {
                this.gui.add(matUniforms[key].value, "r").name(key + " r").min(0).max(1)
                this.gui.add(matUniforms[key].value, "g").name(key + " g").min(0).max(1)
                this.gui.add(matUniforms[key].value, "b").name(key + " g").min(0).max(1);
                return;
            }

            if(matUniforms[key].value == null)
            {
                return;
            }

            this.gui.add(matUniforms[key], "value").name(key).onChange((x)=>{
               
            });

            // self.events.addEventListener("set:" + key, (evt)=>{
            //     self.settings[key] = evt.message;
        })

        // matUniforms = this.grassUniforms;
        // Object.keys(this.grassUniforms).forEach((key)=>{
        //     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //     // @ts-ignore
        //     if(matUniforms[key].value instanceof THREE.Texture)
        //     {
        //         return;
        //     }

        //     if(matUniforms[key].value instanceof THREE.Vector2)
        //     {
        //         this.gui.add(matUniforms[key].value, "x").name(key + " x").onChange((x)=>{
               
        //         });

        //         this.gui.add(matUniforms[key].value, "y").name(key + " y").onChange((x)=>{
               
        //         });
        //         return;
        //     }

        //     if(matUniforms[key].value instanceof THREE.Color)
        //     {
        //         this.gui.add(matUniforms[key].value, "r").name(key + " r").min(0).max(1)
        //         this.gui.add(matUniforms[key].value, "g").name(key + " g").min(0).max(1)
        //         this.gui.add(matUniforms[key].value, "b").name(key + " g").min(0).max(1);
        //         return;
        //     }

        //     if(matUniforms[key].value == null)
        //     {
        //         return;
        //     }

        //     this.gui.add(matUniforms[key], "value").name(key).onChange((x)=>{
               
        //     });

        //     // self.events.addEventListener("set:" + key, (evt)=>{
        //     //     self.settings[key] = evt.message;
        // })
    }

    update(options?: any): void {
        super.update(options);
        this.fogDoorUniforms.time.value = this.getGlobalTime();
        this.renderer.render(this.scene, this.camera);
    }
    
}