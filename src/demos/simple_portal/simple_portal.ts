import DemoBase from "../../SceneBase";
import * as THREE from 'three';

import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader"

import { OrbitalCamera } from "../../shared/generic_scene_elements/camera";
import vertexShader from "./shaders/portal.vs";
import fragmentShader from "./shaders/portal.fs";

import mainTex from "../../shared/assets/textures/noise/HorribleClouds.png"
import dispTex from "../../shared/assets/textures/flow_map/flowmap.png"
import foamTex from "../../shared/assets/textures/placeholder/randomShapes.png"

import model from "./models/FogDoor.glb"
import { DefaultLighting } from "../../shared/generic_scene_elements/lighting";
import skybox from "../../shared/assets/textures/skyboxes/tears_of_steel_bridge_2k.jpg";

export class SimplePortal extends DemoBase
{
    scene: THREE.Scene;
    camera: OrbitalCamera;

    materialUniforms = 
    {
        mainTex: {value: null},
        foamTex: {value: null},
        displacementTex: {value:null},
        displacementStrength: {value: 0.54},
        displacementUVScale: {value: new THREE.Vector2(1.85,1.85)},
        scrollDirection: {value: new THREE.Vector2(0,0.15)},
        backgroundColourTint: {value: new THREE.Color(1.0,1.0,1.0)},
        time:{value:0.0}
    }

    initialize(options?: any) 
    {
        let quad = new THREE.PlaneGeometry(1,1,32,32);
        //let quad = new THREE.SphereGeometry(0.5,32,32,32);
        quad.computeTangents();
        this.scene = new THREE.Scene();
        this.camera = new OrbitalCamera(70,0.01,10.0,this.renderer);

        DefaultLighting.SetupDefaultLighting(this.scene);

        let material = new THREE.ShaderMaterial(
            {
                vertexShader:vertexShader,
                fragmentShader:fragmentShader,
                uniforms:this.materialUniforms
            }
        );
       
        let gltfLoader = new GLTFLoader();
        gltfLoader.load(model, (gltf)=>{
            gltf.scene.traverse(x=>{
                if(x instanceof THREE.Mesh)
                {
                    if(x.name == "FogDoor")
                    {
                        x.material = material;
                    }
                }
            })

            this.scene.add(gltf.scene);
        });

        

        let textureLoader = new THREE.TextureLoader();
        textureLoader.load(mainTex, (tex)=>{
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            this.materialUniforms.mainTex.value = tex;
        })

        textureLoader.load(foamTex, (tex)=>{
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            this.materialUniforms.foamTex.value = tex;
        })

        textureLoader.load(dispTex, (tex)=>{
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            this.materialUniforms.displacementTex.value = tex;
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
        

        Object.keys(this.materialUniforms).forEach((key)=>{
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if(this.materialUniforms[key].value instanceof THREE.Texture)
            {
                return;
            }

            if(this.materialUniforms[key].value instanceof THREE.Vector2)
            {
                this.gui.add(this.materialUniforms[key].value, "x").name(key + " x").onChange((x)=>{
               
                });

                this.gui.add(this.materialUniforms[key].value, "y").name(key + " y").onChange((x)=>{
               
                });
                return;
            }

            if(this.materialUniforms[key].value instanceof THREE.Color)
            {
                this.gui.add(this.materialUniforms[key].value, "r").name(key + " r").min(0).max(1)
                this.gui.add(this.materialUniforms[key].value, "g").name(key + " g").min(0).max(1)
                this.gui.add(this.materialUniforms[key].value, "b").name(key + " g").min(0).max(1);
                return;
            }

            if(this.materialUniforms[key].value == null)
            {
                return;
            }

            this.gui.add(this.materialUniforms[key], "value").name(key).onChange((x)=>{
               
            });

            // self.events.addEventListener("set:" + key, (evt)=>{
            //     self.settings[key] = evt.message;
        })
    }

    update(options?: any): void {
        super.update(options);
        this.materialUniforms.time.value = this.getGlobalTime();
        this.renderer.render(this.scene, this.camera);
    }
    
}