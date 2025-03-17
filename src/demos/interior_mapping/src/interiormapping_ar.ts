import * as THREE from 'three';
import {RGBELoader} from "three/examples/jsm/loaders/RGBELoader"


import VertexShader from "../shaders/parallaxmapping.vs";
import FragmentShader from "../shaders/parallaxmappingPortalCrack.fs";

import DemoBase from '../../../SceneBase';

import EnvironmentMap from "../../../shared/assets/textures/skyboxes/medieval_cafe_1k.hdr";
import DisplacementTex from '../../../shared/assets/textures/normal_map/bumpyNormalMap.jpg'
import WindowPallet from "../textures/WindowSettingsCyclePallet.png";
import InteriorMap from '../../../shared/assets/textures/skyboxes/IndoorEnvironment.jpg'
import Crack from '../textures/Crack.png'
import { OrbitalCamera } from '../../../shared/generic_scene_elements/camera';
import { DefaultLighting } from '../../../shared/generic_scene_elements/lighting';

export default class InteriorMappingScene extends DemoBase{

    camera: OrbitalCamera;
    // Get some basic params
    width = window.innerWidth;
    height = window.innerHeight;

    plane: THREE.Mesh;

    group: THREE.Group = new THREE.Group();
    scene: THREE.Scene = new THREE.Scene();
    globalTime = 0;


    initialize(debug: boolean = true, addGridHelper: boolean = true){
        // setup camera
        this.camera = new OrbitalCamera(40, 0.01,100,this.renderer);
        this.camera.setTarget(new THREE.Vector3(0,0,-0.5));
        
        DefaultLighting.SetupDefaultLighting(this.group);

        let material = new THREE.ShaderMaterial({
            uniforms:{
                time: {value:0.0},
                ZOffset: {value: 1.0},
                tCube: { value: null },
                reflectCube: { value: null },
                dispTex: {value:null},
                crack : {value:null},
                uvScale: {value: new THREE.Vector2(1,1)},
                uvOffset: {value: new THREE.Vector2(0,0)},
                reflBias: {value: -0.05},
                reflScale: {value: 0.80},
                reflPower: {value: 0.4},
                displacementStrength: {value: 0.33},
                displacementScale: {value: 0.14},
                windowPallet: {value:null}
                //value: new THREE.TextureLoader().load(Img)}
            },
            vertexShader: VertexShader,
            fragmentShader:FragmentShader,
            defines:{
                TINT_TEXTURE: false,
                FORCE_OUTPUT_INTERIOR:true
            }
        })

        const geometry = new THREE.PlaneGeometry(0.5,0.5, 8,8);
        geometry.computeTangents();
        this.plane = new THREE.Mesh(geometry, material);

        this.group.add(this.plane);
        this.plane.position.set(0,0,-0.5)

        //this.add(this.group);
       // this.add(new THREE.Mesh(new THREE.SphereGeometry(0.25)));

        let hdri = new RGBELoader().load(EnvironmentMap, (tex)=>{
            hdri.mapping = THREE.EquirectangularReflectionMapping
            this.scene.background = hdri;
            this.scene.environment = hdri;
            material.uniforms["reflectCube"].value = hdri;
        })

        new THREE.TextureLoader().load(InteriorMap, (tex)=>{
            this.plane.material["uniforms"]["tCube"].value = tex;
            material.uniforms["tCube"].value = tex;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.generateMipmaps = true;
        });
        new THREE.TextureLoader().load(DisplacementTex, (tex)=>{
            material.uniforms["dispTex"].value = tex;
            this.plane.material["uniforms"]["dispTex"].value = tex;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.generateMipmaps = true;
        });
        new THREE.TextureLoader().load(WindowPallet, (tex)=>{
            material.uniforms["windowPallet"].value = tex;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.generateMipmaps = false;
            tex.minFilter = tex.magFilter = THREE.NearestFilter;
        });
      
        new THREE.TextureLoader().load(Crack, (tex)=>{
            material.uniforms["crack"].value = tex;
        });


    }

    update(){ 
        super.update();
        this.camera.update();
        this.renderer.autoClear = false;
        this.renderer.render(this.scene, this.camera);

        this.renderer.setClearColor(new THREE.Color(1,0,0), 0.0);
        this.renderer.clear(true, true, true);
        
        this.renderer.render(this.group, this.camera);
        
        this.globalTime = (this.globalTime +  this.deltaTime() * 0.025) % 1.0;
        this.plane.material["uniforms"].time.value = this.globalTime;
    }

    loadTexture(uri:string): THREE.Texture
    {
        var loader = new THREE.TextureLoader();
        loader.setCrossOrigin("");
        let tex = loader.load(uri); 
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }
}