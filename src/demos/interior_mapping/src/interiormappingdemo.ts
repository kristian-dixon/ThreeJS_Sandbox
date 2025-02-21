import * as THREE from 'three';
import {GUI} from 'dat.gui';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {RGBELoader} from "three/examples/jsm/loaders/RGBELoader"

import VertexShader from "../shaders/parallaxmapping.vs";
import FragmentShader from "../shaders/parallaxmapping.fs";


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
import StainedGlassTexture from '../textures/AndiWater.jpg'

/**
 * A class to set up some basic scene elements to minimize code in the
 * main execution file.
 */
export default class InteriorMappingScene extends SceneBase{
   
    

    // A dat.gui class debugger that is added by default
    gui: GUI = null;

    // Setups a scene camera
    camera: THREE.PerspectiveCamera = null;

    // setup renderer
    renderer: THREE.WebGLRenderer = null;

    // setup Orbitals
    orbitals: OrbitControls = null;

    material: THREE.ShaderMaterial = null;
    holeMaterial: THREE.ShaderMaterial = null;

    // Get some basic params
    width = window.innerWidth;
    height = window.innerHeight;

    cube: THREE.Mesh;

    currentPage = 0;
    group: THREE.Group = new THREE.Group();


    initialize(debug: boolean = true, addGridHelper: boolean = true){
        // setup camera
        this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, .1, 100);
        this.camera.position.z = 0;
        this.camera.position.y = 0;
        this.camera.position.x = 4;
        this.camera.lookAt(0,0.5,0);

       const light = new THREE.DirectionalLight(0xffffff,2);
       light.position.set(4, 10, 10);
       this.group.add(light);
       this.group.add(new THREE.HemisphereLight(0xffffff, 0xfdaa91, 2.0));

        // setup renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById("app") as HTMLCanvasElement,
            alpha: true
        });
        this.renderer.setSize(this.width, this.height);

        // add window resizing
        InteriorMappingScene.addWindowResizing(this.camera, this.renderer);

        // sets up the camera's orbital controls
        this.orbitals = new OrbitControls(this.camera, this.renderer.domElement)

       

        // set the background color
        //this.background = new THREE.Color(0x010408);

        // Creates the geometry + materials
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        //const geometry = new THREE.SphereGeometry(0.5);
        geometry.computeTangents();

        let self = this;
        let p = ""

        let px = CubeMap_px;
        let nx = CubeMap_nx;
        let py = CubeMap_py;
        let ny = CubeMap_ny;
        let pz = CubeMap_pz;
        let nz = CubeMap_nz;

        let interiorMap = new THREE.CubeTextureLoader().load([px, nx, py, ny, pz, nz])
        
        

        //this.background = interiorMap;
        //this.environment = interiorMap;
        //this.background = new THREE.Color(1,0,0)

        this.material = new THREE.ShaderMaterial({
            uniforms:{
                time: {value:0.0},
                ZOffset: {value: 1.0},
                tCube: { value: interiorMap },
                reflectCube: { value: null },
                dispTex: {value:null},
                stainedGlass : {value:null},
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

        this.holeMaterial = new THREE.ShaderMaterial().copy(this.material);
        this.holeMaterial.uniforms.reflBias.value = 1;
        this.holeMaterial.uniforms.displacementScale.value = 0;

        let hdri = new RGBELoader().load(EnvironmentMap, (tex)=>{
            hdri.mapping = THREE.EquirectangularReflectionMapping
            this.background = hdri;
            this.environment = hdri;

            this.material.uniforms["reflectCube"].value = hdri;
            this.holeMaterial.uniforms["reflectCube"].value = hdri;
           
            
        })

        new THREE.TextureLoader().load(DisplacementTex, (tex)=>{
            this.material.uniforms["dispTex"].value = tex;
            this.holeMaterial.uniforms["dispTex"].value = tex;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.generateMipmaps = true;
        });
        new THREE.TextureLoader().load(WindowPallet, (tex)=>{
            this.material.uniforms["windowPallet"].value = tex;
            this.holeMaterial.uniforms["windowPallet"].value = tex;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.generateMipmaps = false;
            tex.minFilter = tex.magFilter = THREE.NearestFilter;
        });
      
        new THREE.TextureLoader().load(StainedGlassTexture, (tex)=>{
            this.material.uniforms["stainedGlass"].value = tex;
            this.holeMaterial.uniforms["stainedGlass"].value = tex;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        });

        

        let cube = new THREE.Mesh(geometry, this.material);
        //cube.position.y = .5;
        // add to scene
        //this.add(cube);
        //this.cube = cube;


        this.loadModel(Model)


        // setup Debugger
        if (debug) {
            this.gui =  new GUI();

            // Add camera to debugger
            const cameraGroup = this.gui.addFolder('Camera');
            cameraGroup.add(this.camera, 'fov', 20, 80);
            cameraGroup.add(this.camera, 'zoom', 0, 1);
            cameraGroup.open();

            const materialSettingsGroup = this.gui.addFolder("Material Properties");
            const uvScaleGroup = materialSettingsGroup.addFolder("UV Scale");
            uvScaleGroup.add(this.material.uniforms["uvScale"].value, "x");
            uvScaleGroup.add(this.material.uniforms["uvScale"].value, "y");

            const uvOffsetGroup = materialSettingsGroup.addFolder("UV Offset");
            uvOffsetGroup.add(this.material.uniforms["uvOffset"].value, "x");
            uvOffsetGroup.add(this.material.uniforms["uvOffset"].value, "y");

            materialSettingsGroup.add(this.material.uniforms['reflBias'], 'value', -1,1, 0.01).name('Fresnel Bias');
            materialSettingsGroup.add(this.material.uniforms['reflScale'], 'value', -2,2, 0.01).name('Fresnel Scale');
            materialSettingsGroup.add(this.material.uniforms['reflPower'], 'value', -4,4, 0.01).name('Fresnel Power');

            materialSettingsGroup.add(this.material.uniforms['displacementStrength'], 'value', 0.0,1.0, 0.01).name('Window Distortion Strength');
            materialSettingsGroup.add(this.material.uniforms['displacementScale'], 'value', 0.0,10.0, 0.01).name('Window Distortion Texture Scale');
            
            materialSettingsGroup.add(this.material.defines, 'TINT_TEXTURE').name('Stained Glass Mode');

            

            let roomDepthSetting = materialSettingsGroup.add(this.material.uniforms["ZOffset"], "value", -1, 10, 0.01);
            roomDepthSetting.name("Depth");
            materialSettingsGroup.open();
            // Add the cube with some properties
            // const cubeGroup = this.debugger.addFolder("Cube");
            // cubeGroup.add(cube.position, 'x', -10, 10);
            // cubeGroup.add(cube.position, 'y', .5, 10);
            // cubeGroup.add(cube.position, 'z', -10, 10);
            // cubeGroup.open();

            let textureUploaderFwd = document.createElement("input")
            textureUploaderFwd.type = "file" 
            textureUploaderFwd.accept = ".png"
            textureUploaderFwd.style.visibility="hidden";
            textureUploaderFwd.addEventListener("change", (evt)=>{
                var userImageURL = URL.createObjectURL( textureUploaderFwd.files[0] );
            
                //this.loadTexture(userImageURL);

                nx = userImageURL;
                interiorMap = new THREE.CubeTextureLoader().load([px, nx, py, ny, pz, nz]);
                
                this.material.uniforms["tCube"].value = interiorMap;
            })

            let textureUploaderLeft = document.createElement("input")
            textureUploaderLeft.type = "file" 
            textureUploaderLeft.accept = ".png"
            textureUploaderLeft.style.visibility="hidden";
            textureUploaderLeft.addEventListener("change", (evt)=>{
                var userImageURL = URL.createObjectURL( textureUploaderLeft.files[0] );
            
                //this.loadTexture(userImageURL);

                nz = userImageURL;
                interiorMap = new THREE.CubeTextureLoader().load([px, nx, py, ny, pz, nz]);
                
                this.material.uniforms["tCube"].value = interiorMap;
            })

            let textureUploaderRight = document.createElement("input")
            textureUploaderRight.type = "file" 
            textureUploaderRight.accept = ".png"
            textureUploaderRight.style.visibility="hidden";
            textureUploaderRight.addEventListener("change", (evt)=>{
                var userImageURL = URL.createObjectURL( textureUploaderRight.files[0] );
                pz = userImageURL;
                interiorMap = new THREE.CubeTextureLoader().load([px, nx, py, ny, pz, nz]);
                this.material.uniforms["tCube"].value = interiorMap;
            })

            let textureUploaderTop = document.createElement("input")
            textureUploaderTop.type = "file" 
            textureUploaderTop.accept = ".png"
            textureUploaderTop.style.visibility="hidden";
            textureUploaderTop.addEventListener("change", (evt)=>{
                var userImageURL = URL.createObjectURL( textureUploaderTop.files[0] );
                py = userImageURL;
                interiorMap = new THREE.CubeTextureLoader().load([px, nx, py, ny, pz, nz]);
                this.material.uniforms["tCube"].value = interiorMap;
            })

            let textureUploaderBottom = document.createElement("input")
            textureUploaderBottom.type = "file" 
            textureUploaderBottom.accept = ".png"
            textureUploaderBottom.style.visibility="hidden";
            textureUploaderBottom.addEventListener("change", (evt)=>{
                var userImageURL = URL.createObjectURL( textureUploaderBottom.files[0] );
                ny = userImageURL;
                interiorMap = new THREE.CubeTextureLoader().load([px, nx, py, ny, pz, nz]);
                this.material.uniforms["tCube"].value = interiorMap;
            })
    
            let buttonsFuncs = {
                textureImporterFwd:function(){
                    textureUploaderFwd.click();
                },

                textureImporterLeft:function(){
                    textureUploaderLeft.click();
                },

                textureImporterRight:function(){
                    textureUploaderRight.click();
                },

                textureImporterTop:function(){
                    textureUploaderTop.click();
                },
                textureImporterBottom:function(){
                    textureUploaderBottom.click();
                }
            }
            
            this.gui.add(buttonsFuncs, "textureImporterFwd").name("Load Front Texture");
            this.gui.add(buttonsFuncs, "textureImporterLeft").name("Load Left Texture");
            this.gui.add(buttonsFuncs, "textureImporterRight").name("Load Right Texture");
            this.gui.add(buttonsFuncs, "textureImporterTop").name("Load Top Texture");
            this.gui.add(buttonsFuncs, "textureImporterBottom").name("Load Bottom Texture");
            //this.gui.add(buttonsFuncs, "textureImporterRight").name("Load Right Texture");
            



            //materialSettingsGroup.add(this.material.defines,"OUTPUT_RED");
        }
    }


    loadModel(model:any){
        let self = this;

        let gltfLoader = new GLTFLoader();
        gltfLoader.load(model, (gltf)=>{
            let bounds = new THREE.Box3().setFromObject(gltf.scene);
            let boundsSize = bounds.getSize(new THREE.Vector3())
            let scale = 3.0/Math.max(boundsSize.x, boundsSize.y, boundsSize.z);

            let center = bounds.getCenter(new THREE.Vector3());
            center = center.multiplyScalar(-scale);
            
            gltf.scene.position.copy(center);
            
           

            gltf.scene.traverse(x=>{
                if(x instanceof THREE.Mesh){
                    console.log(x.material);
                    if(x.material.name == "Window"){
                        (x.geometry as THREE.BufferGeometry).computeTangents();
                        x.material = self.material;
                    }

                    if(x.material.name == "Hole"){
                        (x.geometry as THREE.BufferGeometry).computeTangents();
                        x.material = self.holeMaterial;
                    }
                }
            })

            gltf.scene.scale.set(scale,scale,scale);
            self.group.add(gltf.scene);
           
            
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
        
        this.globalTime = (this.globalTime +  this.timeManager.getDelta() * 0.1) % 1.0;

        this.group.traverse((x)=>{
            if(x instanceof THREE.Light){
                x.intensity = 0.25;//1.0 - Math.abs((this.globalTime - 0.5) * 2.0);
            }
        })
        this.material.uniforms.time.value = this.globalTime;
        this.holeMaterial.uniforms.time.value = this.globalTime;
        
        if(this.cube){
            // this.cube.translateX(0.1)
            //this.cube.rotateY(0.01);
        }
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
}