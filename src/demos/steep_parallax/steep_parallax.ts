import * as THREE from "three";
import DemoBase from "../../SceneBase";
import { OrbitalCamera } from "../../shared/generic_scene_elements/camera";
import { DefaultLighting } from "../../shared/generic_scene_elements/lighting";

import albedoTex from "./textures/Rock062_1K-PNG_Color.png"
import normalTex from "./textures/Rock062_1K-GL-PackedDisp.png"

import vertexShader from "./shaders/steep_parallax.vs"
import fragmentShader from "./shaders/steep_parallax.fs"

export class SteepParallaxDemo extends DemoBase
{
    camera: THREE.Camera;
    scene: THREE.Scene;

    materialUniforms = {
        AlbedoMap: {value:null},
        NormalMap: {value:null},
        BumpScale: {value:0.05},
        InvModelMatrix: {value:null},
        LightPos:{value:new THREE.Vector3(0,10,-5)}
        
    }

    initialize(options?: any) {
        let quad = new THREE.PlaneGeometry(1,1);
        this.scene = new THREE.Scene();
        this.camera = new OrbitalCamera(70,0.001,10.0,this.renderer);

        let mesh = new THREE.Mesh(quad, new THREE.ShaderMaterial(
            {
                vertexShader:vertexShader,
                fragmentShader:fragmentShader,
                uniforms:this.materialUniforms
            }
        ));
        mesh.position.setZ(-1.0);
        this.scene.add(mesh);

        let invMatrix = new THREE.Matrix4().copy(mesh.matrixWorld).invert();
        this.materialUniforms.InvModelMatrix.value = invMatrix;

        DefaultLighting.SetupDefaultLighting(this.scene);
        this.scene.background = new THREE.Color("Green");

        let textureLoader = new THREE.TextureLoader();
        textureLoader.load(albedoTex, (tex)=>{
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            this.materialUniforms.AlbedoMap.value = tex;
        });

        textureLoader.load(normalTex, (tex)=>{
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            this.materialUniforms.NormalMap.value = tex;
        });
    }

    override update(options?: any): void {
        super.update(options);
        this.renderer.render(this.scene, this.camera);
    }
    
}