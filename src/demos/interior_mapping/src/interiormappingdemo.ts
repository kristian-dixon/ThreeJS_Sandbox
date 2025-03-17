import * as THREE from 'three';
import {GUI} from 'dat.gui';
import {RGBELoader} from "three/examples/jsm/loaders/RGBELoader"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import DemoBase from '../../../SceneBase';

import VertexShader from "../shaders/parallaxmapping.vs";
import FragmentShader from "../shaders/parallaxmapping.fs";

import CubeMap_nx from "../textures/Room2/nx.png";
import CubeMap_ny from "../textures/Room/ny.png";
import CubeMap_pz from "../textures/Room/pz.png";
import CubeMap_px from "../textures/Room/px.png";
import CubeMap_py from "../textures/Room/py.png";
import CubeMap_nz from "../textures/Room2/nz.png";

import EnvironmentMap from "../../../shared/assets/textures/skyboxes/medieval_cafe_1k.hdr";
import WindowPallet from "../textures/WindowSettingsCyclePallet.png";

import Model from '../../../shared/assets/models/windows.glb'

import DisplacementTex from '../../../shared/assets/textures/normal_map/bumpyNormalMap.jpg'
import StainedGlassTexture from '../../../shared/assets/textures/noise/VoroniColours.jpg'
import { OrbitalCamera } from '../../../shared/generic_scene_elements/camera';
import { DefaultLighting } from '../../../shared/generic_scene_elements/lighting';


export default class InteriorMappingScene extends DemoBase{
    camera: OrbitalCamera;
    material: THREE.ShaderMaterial = null;
    holeMaterial: THREE.ShaderMaterial = null;

    plane: THREE.Mesh;

    currentPage = 0;
    group: THREE.Group = new THREE.Group();
    scene: THREE.Scene = new THREE.Scene();

    gltf:THREE.Group;
    globalTime = 0;

    initialize(){
        this.camera = new OrbitalCamera(60, .1, 100, this.renderer);
        this.scene.position.set(0,0,-1);
        this.group.position.set(0,0,-1);

        DefaultLighting.SetupDefaultLighting(this.group);

        this.material = new THREE.ShaderMaterial({
            uniforms:{
                time: {value:0.0},
                ZOffset: {value: 1.0},
                tCube: { value: null },
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

        const geometry = new THREE.PlaneGeometry(1,1, 32,32);
        geometry.computeTangents();
        this.plane = new THREE.Mesh(geometry, new THREE.ShaderMaterial().copy(this.material));
        this.plane.visible = false;
        this.group.add(this.plane);

        this.loadAllTextures();
        this.loadModel(Model)

        //GUI
        {
            //Horrible UI Code (just don't look at it)

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

            let px = CubeMap_px; let nx = CubeMap_nx; let py = CubeMap_py;
            let ny = CubeMap_ny; let pz = CubeMap_pz; let nz = CubeMap_nz;

            let textureUploaderFwd = document.createElement("input")
            textureUploaderFwd.type = "file" 
            textureUploaderFwd.accept = ".png"
            textureUploaderFwd.style.visibility="hidden";
            textureUploaderFwd.addEventListener("change", (evt)=>{
                var userImageURL = URL.createObjectURL( textureUploaderFwd.files[0] );
            
                nx = userImageURL;
                new THREE.CubeTextureLoader().load([px, nx, py, ny, pz, nz], (tex)=>{
                    this.material.uniforms["tCube"].value = tex;
                });                
            })

            let textureUploaderLeft = document.createElement("input")
            textureUploaderLeft.type = "file" 
            textureUploaderLeft.accept = ".png"
            textureUploaderLeft.style.visibility="hidden";
            textureUploaderLeft.addEventListener("change", (evt)=>{
                var userImageURL = URL.createObjectURL( textureUploaderLeft.files[0] );
            
                //this.loadTexture(userImageURL);

                nz = userImageURL;
                new THREE.CubeTextureLoader().load([px, nx, py, ny, pz, nz], (tex)=>{
                    this.material.uniforms["tCube"].value = tex;
                });  
            })

            let textureUploaderRight = document.createElement("input")
            textureUploaderRight.type = "file" 
            textureUploaderRight.accept = ".png"
            textureUploaderRight.style.visibility="hidden";
            textureUploaderRight.addEventListener("change", (evt)=>{
                var userImageURL = URL.createObjectURL( textureUploaderRight.files[0] );
                pz = userImageURL;
                new THREE.CubeTextureLoader().load([px, nx, py, ny, pz, nz], (tex)=>{
                    this.material.uniforms["tCube"].value = tex;
                });  
            })

            let textureUploaderTop = document.createElement("input")
            textureUploaderTop.type = "file" 
            textureUploaderTop.accept = ".png"
            textureUploaderTop.style.visibility="hidden";
            textureUploaderTop.addEventListener("change", (evt)=>{
                var userImageURL = URL.createObjectURL( textureUploaderTop.files[0] );
                py = userImageURL;
                new THREE.CubeTextureLoader().load([px, nx, py, ny, pz, nz], (tex)=>{
                    this.material.uniforms["tCube"].value = tex;
                });  
            })

            let textureUploaderBottom = document.createElement("input")
            textureUploaderBottom.type = "file" 
            textureUploaderBottom.accept = ".png"
            textureUploaderBottom.style.visibility="hidden";
            textureUploaderBottom.addEventListener("change", (evt)=>{
                var userImageURL = URL.createObjectURL( textureUploaderBottom.files[0] );
                ny = userImageURL;
                new THREE.CubeTextureLoader().load([px, nx, py, ny, pz, nz], (tex)=>{
                    this.material.uniforms["tCube"].value = tex;
                });  
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

            this.gui.add(this, 'showExplainerScene');
        }
    }

    update(){
        super.update();
       
        this.renderer.autoClear = false;
        this.renderer.render(this.scene, this.camera);

        this.renderer.setClearColor(new THREE.Color(1,0,0), 0.0);
        this.renderer.clear(true, true, true);

       
        this.renderer.render(this.group, this.camera);
        
        this.globalTime = (this.globalTime +  this.getDeltaTime() * 0.1) % 1.0;

        this.group.traverse((x)=>{
            if(x instanceof THREE.Light){
                x.intensity = 0.25;//1.0 - Math.abs((this.globalTime - 0.5) * 2.0);
            }
        })
        this.material.uniforms.time.value = this.globalTime;
        this.holeMaterial.uniforms.time.value = this.globalTime;
        this.plane.material["uniforms"].time.value = this.globalTime;   
    }


    setUniformValueOnAllMaterials(identifier:string, value:any)
    {
        this.material.uniforms[identifier].value = value;
        this.holeMaterial.uniforms[identifier].value = value;
        this.plane.material["uniforms"][identifier].value = value;
    }

    loadAllTextures()
    {
        //Setting the address of the cubemaps here so they're easier to change through UI
        let px = CubeMap_px; let nx = CubeMap_nx; let py = CubeMap_py;
        let ny = CubeMap_ny; let pz = CubeMap_pz; let nz = CubeMap_nz;
        new THREE.CubeTextureLoader().load([px, nx, py, ny, pz, nz], (tex)=>{
            this.setUniformValueOnAllMaterials('tCube', tex);
        })

        let hdri = new RGBELoader().load(EnvironmentMap, (tex)=>{
            hdri.mapping = THREE.EquirectangularReflectionMapping
            this.scene.background = hdri;
            this.scene.environment = hdri;

            this.setUniformValueOnAllMaterials("reflectCube", hdri);
        })

        let textureLoader = new THREE.TextureLoader();
        textureLoader.load(DisplacementTex, (tex)=>{
            this.setUniformValueOnAllMaterials("dispTex", tex);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        });
        textureLoader.load(WindowPallet, (tex)=>{
            this.setUniformValueOnAllMaterials("windowPallet", tex);           
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.generateMipmaps = false;
            tex.minFilter = tex.magFilter = THREE.NearestFilter;
        });

        new THREE.TextureLoader().load(StainedGlassTexture, (tex)=>{
            this.setUniformValueOnAllMaterials("stainedGlass", tex); 
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        });

    }

    loadModel(model:any){
        let self = this;

        let gltfLoader = new GLTFLoader();
        gltfLoader.load(model, (gltf)=>{
            let bounds = new THREE.Box3().setFromObject(gltf.scene);
            let boundsSize = bounds.getSize(new THREE.Vector3())
            let scale = 0.5/Math.max(boundsSize.x, boundsSize.y, boundsSize.z);

            let center = bounds.getCenter(new THREE.Vector3());
            center = center.multiplyScalar(-scale);
            
            gltf.scene.position.copy(center);
            
           

            gltf.scene.traverse(x=>{
                if(x instanceof THREE.Mesh){
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
           
            self.gltf = gltf.scene;
        })
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


    recieveMessage(call: string, args: any) {
        this[call](args);
    }

    //Below is all the states for the blogpost. This should be updated to be less gross eventually.
    showBuildingScene()
    {
        this.plane.visible = false;
        this.gltf.visible = true;

        //Reset camera
        this.camera.position.z = 8;
        this.camera.position.y = 0.0;
        this.camera.position.x = 0.0;
        this.camera.lookAt(0,0.5,0);
    }

    showExplainerScene()
    {
        this.plane.visible = true;
        this.gltf.visible = false;
        
        this.camera.position.z = 8;
        this.camera.position.y = 0.0;
        this.camera.position.x = 0.0;
        this.camera.lookAt(0,0,0);

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