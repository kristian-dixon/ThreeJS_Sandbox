import * as THREE from 'three';

import DemoBase, { XRState } from '../../../SceneBase';
import { OrbitalCamera } from '../../../shared/generic_scene_elements/camera';
import { DefaultLighting } from '../../../shared/generic_scene_elements/lighting';

//Shaders
import VertexShader from "../shaders/parallaxmapping.vs";
import FragmentShader from "../shaders/parallaxmappingPortalCrack.fs";

//Assets
import InteriorMap from '../../../shared/assets/textures/skyboxes/IndoorEnvironment.jpg'
import Crack from '../textures/Crack.png'

export default class InteriorMappingScene extends DemoBase{

    camera: OrbitalCamera;
    plane: THREE.Mesh;

    group: THREE.Group = new THREE.Group();
    scene: THREE.Scene = new THREE.Scene();
    globalTime = -1.4;


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

        const geometry = new THREE.PlaneGeometry(0.5,0.5, 32,32);
        geometry.computeTangents();
        this.plane = new THREE.Mesh(geometry, material);

        this.group.add(this.plane);
        this.plane.position.set(0,0,-0.5)

        let textureLoader = new THREE.TextureLoader();
        textureLoader.load(InteriorMap, (tex)=>{
            material.uniforms["tCube"].value = tex;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        });
        textureLoader.load(Crack, (tex)=>{
            material.uniforms["crack"].value = tex;
        });

        this.events.addEventListener("XR_StateChanged", (evt)=>{
            if(evt.message.targetState === XRState.RunningVR)
            {
                this.group.position.set(0,1.25,-1);
            }

            if(evt.message.targetState === XRState.ExitVR)
            {
                this.group.position.set(0,0,0);
            }
        })
    }

    update(){ 
        super.update();
        this.renderer.render(this.group, this.camera);
        this.globalTime += this.getDeltaTime() * 0.1;//(this.globalTime +  this.getDeltaTime() * 0.025) % 1.0;
        this.plane.material["uniforms"].time.value = (Math.sin(this.globalTime) + 1) * 0.5;
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