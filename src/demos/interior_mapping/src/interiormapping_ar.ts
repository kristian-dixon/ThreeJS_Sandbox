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

export default class InteriorMappingScene extends DemoBase{

    camera: OrbitalCamera;
    material: THREE.ShaderMaterial = null;
    holeMaterial: THREE.ShaderMaterial = null;

    // Get some basic params
    width = window.innerWidth;
    height = window.innerHeight;

    plane: THREE.Mesh;

    currentPage = 0;
    group: THREE.Group = new THREE.Group();
    scene: THREE.Scene = new THREE.Scene();

    initialize(debug: boolean = true, addGridHelper: boolean = true){
        // setup camera
        this.camera = new OrbitalCamera(40, 0.01,100,this.renderer);
        this.camera.setTarget(new THREE.Vector3(0,0,-0.5));
        const light = new THREE.DirectionalLight(0xffffff,2);
        light.position.set(4, 10, 10);
        this.group.add(light);
        this.group.add(new THREE.HemisphereLight(0xffffff, 0xfdaa91, 2.0));

        // Creates the geometry + materials
        const geometry = new THREE.PlaneGeometry(0.5,0.5, 8,8);
        //const geometry = new THREE.SphereGeometry(0.5);
        geometry.computeTangents();

        //let interiorMap = new THREE.CubeTextureLoader().load([px, nx, py, ny, pz, nz])
        this.material = new THREE.ShaderMaterial({
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
                TINT_TEXTURE: false
            }
        })

        this.plane = new THREE.Mesh(geometry, new THREE.ShaderMaterial().copy(this.material));

        this.group.add(this.plane);
        this.plane.position.set(0,0,-0.5)

        //this.add(this.group);
       // this.add(new THREE.Mesh(new THREE.SphereGeometry(0.25)));

        let hdri = new RGBELoader().load(EnvironmentMap, (tex)=>{
            hdri.mapping = THREE.EquirectangularReflectionMapping
            this.scene.background = hdri;
            this.scene.environment = hdri;

            this.material.uniforms["reflectCube"].value = hdri;
            this.plane.material["uniforms"]["reflectCube"].value = hdri;
           
            
        })

        new THREE.TextureLoader().load(InteriorMap, (tex)=>{
            this.material.uniforms["tCube"].value = tex;
            this.plane.material["uniforms"]["tCube"].value = tex;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.generateMipmaps = true;
        });
        new THREE.TextureLoader().load(DisplacementTex, (tex)=>{
            this.material.uniforms["dispTex"].value = tex;
            this.plane.material["uniforms"]["dispTex"].value = tex;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.generateMipmaps = true;
        });
        new THREE.TextureLoader().load(WindowPallet, (tex)=>{
            this.material.uniforms["windowPallet"].value = tex;
            this.plane.material["uniforms"]["windowPallet"].value = tex;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.generateMipmaps = false;
            tex.minFilter = tex.magFilter = THREE.NearestFilter;
        });
      
        new THREE.TextureLoader().load(Crack, (tex)=>{
            this.material.uniforms["crack"].value = tex;
            this.plane.material["uniforms"]["crack"].value = tex;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        });


        //this.loadModel(Model)
        this.showExplainerScene();
        window["DemoApp"] = this;
    }


   
    globalTime = 0;
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

    changeState(pageIndex:number)
    {
        if(pageIndex == this.currentPage)
        {
            return;
        }

        //Exit state
        switch(this.currentPage){
            case 0:{
                break;
            }
            default:{
                break;
            }
        }

        this.currentPage = pageIndex;
        switch(this.currentPage){
            case 0:{
                break;
            }
            default:{
                break;
            }
        }
    }

    recieveMessage(call: string, args: any) {
        this[call](args);
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














    showBuildingScene()
    {


        //Reset camera
        this.camera.position.z = 1;
        this.camera.position.y = 0.0;
        this.camera.position.x = 0.0;
        this.camera.lookAt(0,0.5,0);
    }

    showExplainerScene()
    {

        
        (this.plane.material as THREE.Material).defines = {};
        (this.plane.material as THREE.Material).defines["FORCE_OUTPUT_INTERIOR"] = true;
        (this.plane.material as THREE.Material).needsUpdate = true;
    }

    showNearIntersection(){
        (this.plane.material as THREE.Material).defines = {};
        (this.plane.material as THREE.Material).defines["SHOW_NEAR_SURFACE_HIT_POS"] = true;
        (this.plane.material as THREE.Material).defines["FORCE_OUTPUT_INTERIOR"] = true;
        (this.plane.material as THREE.Material).needsUpdate = true;
    }

    showMinDirection(){
        (this.plane.material as THREE.Material).defines = {};
        (this.plane.material as THREE.Material).defines["SHOW_MIN_DIRECTION"] = true;
        (this.plane.material as THREE.Material).defines["FORCE_OUTPUT_INTERIOR"] = true;
        (this.plane.material as THREE.Material).needsUpdate = true;
    }

    showAxisBorderDist(){
        (this.plane.material as THREE.Material).defines = {};
        (this.plane.material as THREE.Material).defines["SHOW_DIST_TO_AXIS_BORDER"] = true;
        (this.plane.material as THREE.Material).defines["FORCE_OUTPUT_INTERIOR"] = true;
        (this.plane.material as THREE.Material).needsUpdate = true;
    }

    showMinDistance(){
        (this.plane.material as THREE.Material).defines = {};
        (this.plane.material as THREE.Material).defines["SHOW_MIN_DIST"] = true;
        (this.plane.material as THREE.Material).defines["FORCE_OUTPUT_INTERIOR"] = true;
        (this.plane.material as THREE.Material).needsUpdate = true;
    }

    showFinalPos(){
        (this.plane.material as THREE.Material).defines = {};
        (this.plane.material as THREE.Material).defines["SHOW_FINAL_POS"] = true;
        (this.plane.material as THREE.Material).defines["FORCE_OUTPUT_INTERIOR"] = true;
        (this.plane.material as THREE.Material).needsUpdate = true;
    }

    showInteriorOnly(){
        (this.plane.material as THREE.Material).defines = {};
        (this.plane.material as THREE.Material).defines["FORCE_OUTPUT_INTERIOR"] = true;
        (this.plane.material as THREE.Material).needsUpdate = true;
    }
    
    enableTint(){
        (this.plane.material as THREE.Material).defines = {};
        (this.plane.material as THREE.Material).defines["TINT_TEXTURE"] = true;
        (this.plane.material as THREE.Material).needsUpdate = true;
    }

    setDistortion(val:number){
        (this.plane.material as THREE.Material).defines = {};
        (this.plane.material as THREE.Material).defines["FORCE_DISPLACEMENT_ENABLE"] = true;
        (this.plane.material as THREE.Material).defines["FORCE_DISABLE_DAY_NIGHT"] = true;
        (this.plane.material as THREE.Material).needsUpdate = true;
        (this.plane.material as THREE.ShaderMaterial).uniforms["displacementStrength"].value = val;
    }

    showBasicInteriorReflection()
    {
        (this.plane.material as THREE.Material).defines = {};
        (this.plane.material as THREE.Material).defines["FORCE_DISABLE_DAY_NIGHT"] = true;
        (this.plane.material as THREE.Material).needsUpdate = true;       
    }


    showFinal()
    {
        (this.plane.material as THREE.Material).defines = {};
        //(this.plane.material as THREE.Material).defines["FORCE_DISABLE_DAY_NIGHT"] = true;
        (this.plane.material as THREE.Material).needsUpdate = true;  
    }

    
    static addWindowResizing(camera: THREE.PerspectiveCamera, renderer: THREE.Renderer){
        
    }











    //     (this.plane.material as THREE.Material).defines["SHOW_NEAR_SURFACE_HIT_POS"] = true;
    //     (this.plane.material as THREE.Material).defines["SHOW_MIN_DIRECTION"] = false;
    //     (this.plane.material as THREE.Material).defines["SHOW_MIN_DIST"] = false;
    //     (this.plane.material as THREE.Material).defines["SHOW_FINAL_POS"] = false;
    //     (this.plane.material as THREE.Material).defines["DISABLE_RNG"] = false;
    //     (this.plane.material as THREE.Material).defines["DISABLE_NORMAL_MAP"] = false;
    //     (this.plane.material as THREE.Material).defines["TINT_TEXTURE"] = false;
    //     (this.plane.material as THREE.Material).defines["FORCE_OUTPUT_INTERIOR"] = true;
    //     (this.plane.material as THREE.Material).defines["FORCE_OUTPUT_REFLECTION_STRENGTH"] = false;
}