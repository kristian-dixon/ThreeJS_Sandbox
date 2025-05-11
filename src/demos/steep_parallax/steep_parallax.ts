import * as THREE from "three";
import DemoBase from "../../SceneBase";
import { OrbitalCamera } from "../../shared/generic_scene_elements/camera";
import { DefaultLighting } from "../../shared/generic_scene_elements/lighting";

import albedoTex from "./textures/ganges_river_pebbles_diff_1k.jpg"
import normalTex from "./textures/ganges_river_pebbles_nor_gl_packed.png"

import vertexShader from "./shaders/steep_parallax.vs"
import fragmentShader from "./shaders/steep_parallax.fs"

export class SteepParallaxDemo extends DemoBase
{
    camera: THREE.Camera;
    scene: THREE.Scene;

    materialUniforms = {
        AlbedoMap: {value:null},
        NormalMap: {value:null},
        BumpScale: {value:0.15},
        InvModelMatrix: {value:null},
        LightPos:{value:new THREE.Vector3(8,10,5.5)}
    }

    materialDefines = {
        //steep_mapping:false,
        occlusion_mapping: true
    }

    initialize(options?: any) {
        let quad = new THREE.PlaneGeometry(1,1,32,32);
        //let quad = new THREE.SphereGeometry(0.5,32,32,32);
        quad.computeTangents();
        this.scene = new THREE.Scene();
        this.camera = new OrbitalCamera(70,0.01,10.0,this.renderer);

        let mesh = new THREE.Mesh(quad, new THREE.ShaderMaterial(
            {
                vertexShader:vertexShader,
                fragmentShader:fragmentShader,
                uniforms:this.materialUniforms,
                defines:this.materialDefines
            }
        ));
        mesh.position.setZ(-1.0);
        this.scene.add(mesh);

        let invMatrix = new THREE.Matrix4().copy(mesh.matrixWorld).invert();
        this.materialUniforms.InvModelMatrix.value = invMatrix;

        //DefaultLighting.SetupDefaultLighting(this.scene);
        this.scene.background = new THREE.Color("Blue");

        let textureLoader = new THREE.TextureLoader();
        textureLoader.load(albedoTex, (tex)=>{
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            this.materialUniforms.AlbedoMap.value = tex;
        });

        textureLoader.load(normalTex, (tex)=>{
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            this.materialUniforms.NormalMap.value = tex;
        });

        this.gui.add(this.materialUniforms.BumpScale, "value").name("Bump Scale");
        this.gui.add(this.materialDefines, "occlusion_mapping").name("Occlusion Mapping").onFinishChange(()=>{
            mesh.material.needsUpdate = true;
        });

        let sphereMesh = new THREE.Mesh(new THREE.SphereGeometry(0.015), new THREE.MeshBasicMaterial({color:new THREE.Color("Yellow")}));
        this.scene.add(sphereMesh);

        let cubeForDepthTesting = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshStandardMaterial({color:new THREE.Color("White")}));
        cubeForDepthTesting.position.setX(0.1);
        cubeForDepthTesting.position.setZ(-1.05);
        this.scene.add(cubeForDepthTesting);

        sphereMesh.add(new THREE.PointLight(new THREE.Color("White"), 1.0, 100000.0, 0.0))

        this.materialUniforms.LightPos.value = sphereMesh.position;
    }

    override update(options?: any): void {
        super.update(options);

        this.materialUniforms.LightPos.value.setX(Math.sin(this.getGlobalTime()) * 0.4);
        this.materialUniforms.LightPos.value.setY(Math.cos(this.getGlobalTime()) * 0.4);
        //this.materialUniforms.LightPos.value.setX((0.0));
        //this.materialUniforms.LightPos.value.setY((0.0));
        this.materialUniforms.LightPos.value.setZ((Math.cos(1.0 + this.getGlobalTime() * 0.3)));

        this.renderer.render(this.scene, this.camera);
    }
    
}