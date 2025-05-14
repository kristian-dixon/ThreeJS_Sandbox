import DemoBase from "../../SceneBase";
import * as THREE from 'three';
import { OrbitalCamera } from "../../shared/generic_scene_elements/camera";
import vertexShader from "./shaders/portal.vs";
import fragmentShader from "./shaders/portal.fs";

import mainTex from "../../shared/assets/textures/noise/HorribleClouds.png"
import dispTex from "../../shared/assets/textures/flow_map/flowmap.png"
import foamTex from "../../shared/assets/textures/placeholder/randomShapes.png"


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
        time:{value:0.0}
    }

    initialize(options?: any) 
    {
        let quad = new THREE.PlaneGeometry(1,1,32,32);
        //let quad = new THREE.SphereGeometry(0.5,32,32,32);
        quad.computeTangents();
        this.scene = new THREE.Scene();
        this.camera = new OrbitalCamera(70,0.01,10.0,this.renderer);

        let mesh = new THREE.Mesh(quad, new THREE.ShaderMaterial(
            {
                vertexShader:vertexShader,
                fragmentShader:fragmentShader,
                uniforms:this.materialUniforms
            }
        ));
        mesh.position.setZ(-1.0);
        this.scene.add(mesh);

        this.scene.background = new THREE.Color("Red");

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