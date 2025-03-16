import * as THREE from 'three';
import {GUI} from 'dat.gui';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {RGBELoader} from "three/examples/jsm/loaders/RGBELoader"

import {ARButton} from 'three/examples/jsm/webxr/ARButton.js';

import VertexShader from "../shaders/parallaxmapping.vs";
import FragmentShader from "../shaders/parallaxmappingPortalCrack.fs";


import CubeMap_nx from "../textures/Room2/nx.png";
import CubeMap_ny from "../textures/Room/ny.png";
import CubeMap_pz from "../textures/Room/pz.png";
import CubeMap_px from "../textures/Room/px.png";
import CubeMap_py from "../textures/Room/py.png";
import CubeMap_nz from "../textures/Room2/nz.png";

import EnvironmentMap from "../textures/medieval_cafe_1k.hdr";
import WindowPallet from "../textures/WindowSettingsCyclePallet.png";

import SceneBase from '../../../SceneBase';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';


import Model from '../../whiteboard/models/windows.glb'

import DisplacementTex from '../../../shared/textures/bumpyNormalMap.jpg'
import InteriorMap from '../textures/IndoorEnvironment.jpg'
import Crack from '../textures/CrackTest.png'

/**
 * A class to set up some basic scene elements to minimize code in the
 * main execution file.
 */
export default class InteriorMappingScene extends SceneBase{
    gui: GUI = null;
    camera: THREE.PerspectiveCamera = null;
    renderer: THREE.WebGLRenderer = null;

    orbitals: OrbitControls = null;

    material: THREE.ShaderMaterial = null;
    holeMaterial: THREE.ShaderMaterial = null;

    // Get some basic params
    width = window.innerWidth;
    height = window.innerHeight;

    plane: THREE.Mesh;

    currentPage = 0;
    group: THREE.Group = new THREE.Group();

    initialize(debug: boolean = true, addGridHelper: boolean = true){
        // setup camera
        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, .01, 100);
        this.camera.position.z = 1;
        this.camera.position.y = 0.0;
        this.camera.position.x = 0.0;
        this.camera.lookAt(0,0,-1);

       const light = new THREE.DirectionalLight(0xffffff,2);
       light.position.set(4, 10, 10);
       this.group.add(light);
       this.group.add(new THREE.HemisphereLight(0xffffff, 0xfdaa91, 2.0));

        // setup renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById("app") as HTMLCanvasElement,
            antialias: true,
            alpha: true
        });
        this.renderer.xr.enabled = true;
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // add window resizing
        InteriorMappingScene.addWindowResizing(this.camera, this.renderer);

        // sets up the camera's orbital controls
        this.orbitals = new OrbitControls(this.camera, this.renderer.domElement)


        // Creates the geometry + materials
        const geometry = new THREE.PlaneGeometry(0.5,0.5, 8,8);
        //const geometry = new THREE.SphereGeometry(0.5);
        geometry.computeTangents();

        let px = CubeMap_px;
        let nx = CubeMap_nx;
        let py = CubeMap_py;
        let ny = CubeMap_ny;
        let pz = CubeMap_pz;
        let nz = CubeMap_nz;

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
            this.background = hdri;
            this.environment = hdri;

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


        let button = ARButton.createButton(this.renderer, {offerSession:true});
        document.body.appendChild(button);
        this.renderer.xr.enabled = true;
    }

    gltf:THREE.Group;
    loadModel(model:any){
        let self = this;

        let gltfLoader = new GLTFLoader();
        gltfLoader.load(model, (gltf)=>{
            let bounds = new THREE.Box3().setFromObject(gltf.scene);
            let boundsSize = bounds.getSize(new THREE.Vector3())
            let scale = 1.0/Math.max(boundsSize.x, boundsSize.y, boundsSize.z);

            let center = bounds.getCenter(new THREE.Vector3());
            center = center.multiplyScalar(-scale);
            center.x += 1;
            gltf.scene.position.copy(center);
        
           

            gltf.scene.traverse(x=>{
                x.visible = true;
                if(x instanceof THREE.Mesh){
                    if(x.material.name == "Window"){
                        (x.geometry as THREE.BufferGeometry).computeTangents();
                        x.material = self.material;
                    }

                    if(x.material.name == "Hole"){
                        (x.geometry as THREE.BufferGeometry).computeTangents();
                        x.material = self.material;
                    }
                }
            })

            gltf.scene.scale.set(scale,scale,scale);
            this.group.add(gltf.scene);

        })
    }

    globalTime = 0;
    timeManager: THREE.Clock = new THREE.Clock();
    update(){
        this.camera.updateProjectionMatrix();
              
        this.renderer.autoClear = false;
        this.renderer.render(this, this.camera);

        this.renderer.setClearColor(new THREE.Color(1,0,0), 0.0);
        this.renderer.clear(true, true, true);

        
        this.renderer.render(this.group, this.camera);
        
        this.globalTime = (this.globalTime +  this.timeManager.getDelta() * 0.025) % 1.0;
//
        //this.group.traverse((x)=>{
        //    if(x instanceof THREE.Light){
        //        x.intensity = 0.25;//1.0 - Math.abs((this.globalTime - 0.5) * 2.0);
        //    }
        //})
        //this.material.uniforms.time.value = this.globalTime;
        //this.holeMaterial.uniforms.time.value = this.globalTime;

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
        this.camera.position.z = 8;
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

    /**
     * Given a ThreeJS camera and renderer, resizes the scene if the
     * browser window is resized.
     * @param camera - a ThreeJS PerspectiveCamera object.
     * @param renderer - a subclass of a ThreeJS Renderer object.
     */
    static addWindowResizing(camera: THREE.PerspectiveCamera, renderer: THREE.Renderer){
        window.addEventListener( 'resize', onWindowResize, false );
        function onWindowResize(){

            // uses the global window widths and height
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize( window.innerWidth, window.innerHeight );
        }
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