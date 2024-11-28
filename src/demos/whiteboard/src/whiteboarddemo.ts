import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"

import PaintShaderVert from "../shaders/paintbrush.vs";
import PaintShaderFrag from "../shaders/paintbrush.fs";

import PlanetShaderVert from "../shaders/planet/vertex.vs"
import PlanetShaderFrag from "../shaders/planet/frag.fs"

import FoldoutShaderVert from "../shaders/planet_foldout/vertex.vs"
import FoldoutShaderFrag from "../shaders/planet_foldout/frag.fs"

import GradientTexturePath from "../textures/SeaLandAirGradient.png";

import SceneBase from '../../../SceneBase';
import { InputManager } from '../../../shared/input/InputManager';

import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

import CubeMap_nx from "../textures/cubemap/nx.png";
import CubeMap_ny from "../textures/cubemap/ny.png";
import CubeMap_pz from "../textures/cubemap/nz.png";
import CubeMap_px from "../textures/cubemap/px.png";
import CubeMap_py from "../textures/cubemap/py.png";
import CubeMap_nz from "../textures/cubemap/pz.png";

import { PaintableTexture } from '../../../shared/meshpainting/scripts/PaintableSurface';
import GlbTest from "../models/cursedchunky.glb"


/**
 * A class to set up some basic scene elements to minimize code in the
 * main execution file.
 */
export default class WhiteboardDemoScene extends SceneBase {a
    camera: THREE.PerspectiveCamera = null;
    renderer: THREE.WebGLRenderer = null;

    // Get some basic params
    width = window.innerWidth;
    height = window.innerHeight;

    currentPage = 0;

    sphere: THREE.Mesh;
    raycaster: THREE.Raycaster;

    input:InputManager;
    rootNode: THREE.Object3D;
    clock:THREE.Clock;

    foldoutMaterial: THREE.Material;

    blitQuad: THREE.Object3D;

    animationMixer: THREE.AnimationMixer;

    paintableTexture:PaintableTexture = new PaintableTexture(512,512);

    gltfLoader = new GLTFLoader();
    gltf: THREE.Group;

    initialize(debug: boolean = true, addGridHelper: boolean = true) {
        this.clock = new THREE.Clock(true);
        this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, .1, 100);
        this.camera.position.z = 8;
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById("app") as HTMLCanvasElement,
            alpha: true, 
            
           // preserveDrawingBuffer:true -- this is for the canvas
        });
        this.renderer.setSize(this.width, this.height);

        this.background = new THREE.Color(0x550000);
        this.setupScene();

        this.input=InputManager.Get();
        this.raycaster = new THREE.Raycaster();
        WhiteboardDemoScene.addWindowResizing(this.camera, this.renderer);

        window["scene"] = this;

        this.initStandaloneUI();
    }

    debugger:GUI;
    private initStandaloneUI()
    {
        this.debugger = new GUI();

        this.debugger.addColor(this.paintableTexture,'brushColor').onChange(()=>{
            this.paintableTexture.SetColor(this.paintableTexture.brushColor);
        })

        this.debugger.add(this.paintableTexture.Settings.blendStrength,'value').name("Blend Strength");
        this.debugger.add(this.paintableTexture.Settings.brushRadius,'value').name("Brush Radius");

        let modelUploader = document.createElement("input")
        modelUploader.type = "file" 
        modelUploader.accept = ".glb"
        modelUploader.style.visibility="hidden";
        let self = this;
        modelUploader.addEventListener("change", (evt)=>{
            let modelUrl = URL.createObjectURL( modelUploader.files[0] );
            self.loadModel(modelUrl);
        })


        let textureUploader = document.createElement("input")
        textureUploader.type = "file" 
        textureUploader.accept = ".png"
        textureUploader.style.visibility="hidden";
        textureUploader.addEventListener("change", (evt)=>{
            var userImageURL = URL.createObjectURL( textureUploader.files[0] );
        
            var loader = new THREE.TextureLoader();
            loader.setCrossOrigin("");
            let tex = loader.load(userImageURL); 
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            this.paintableTexture.Import(self.renderer,self.camera,tex);
            //this.foldoutMaterial["uniforms"].uMap.value = tex;
        })

        let buttonsFuncs = {
            modelLoader:function(){
                modelUploader.click();
            },
            textureExporter:function(){
                self.paintableTexture.Export(self.renderer);
            },
            textureImporter:function(){
                textureUploader.click();
            }
        }
        this.debugger.add(buttonsFuncs, "textureExporter").name("Save Texture");
        this.debugger.add(buttonsFuncs, "textureImporter").name("Load Texture");
        this.debugger.add(buttonsFuncs, "modelLoader").name("Load Model");



    }

    private setupScene() {
        const light = new THREE.DirectionalLight(0xffffff, 5);
        light.position.set(4, 10, 10);
        this.add(light);
        this.add(new THREE.HemisphereLight(0xffffff, 0xfdaa91, 2.0));

        this.background = new THREE.Color(0x9f88);

        this.rootNode = new THREE.Object3D();
        this.add(this.rootNode);

        let self = this;
        this.loadModel(GlbTest);

        let gradientTex = new THREE.TextureLoader().load(GradientTexturePath);
        this.foldoutMaterial = new THREE.ShaderMaterial({
            uniforms:{
                uTime:{value:0.9999},
                uGradient:{value:gradientTex},
                uMap:{value:this.paintableTexture.RenderTarget.texture}
            },
            vertexShader:FoldoutShaderVert,
            fragmentShader:FoldoutShaderFrag,
            defines:{
                OUTPUT_HEIGHTMAP: false,
                OUTPUT_BRUSHPOSITION: false,
                OUTPUT_RAW_TEXTURE: true
            }
        })

        this.add(new THREE.Mesh(new THREE.PlaneGeometry(), this.foldoutMaterial));
    }

    loadModel(model:any){
        //Cleanup
        if(this.gltf){
            this.rootNode.remove(this.gltf);
        }
        let self = this;


        this.gltfLoader.load(model, (gltf)=>{
            let bounds = new THREE.Box3().setFromObject(gltf.scene);
            let boundsSize = bounds.getSize(new THREE.Vector3())
            let scale = 3.0/Math.max(boundsSize.x, boundsSize.y, boundsSize.z);

            let center = bounds.getCenter(new THREE.Vector3());
            center = center.multiplyScalar(-scale);
           
            gltf.scene.position.copy(center);

            gltf.scene.traverse(child=>{
                if(child instanceof THREE.Mesh)
                {
                    if(child.material as THREE.Material){
                        child.material["map"] = self.paintableTexture.RenderTarget.texture;
                    }
                    else
                    {
                        for(let i = 0; i < child.material.length; i++)
                        {
                            child.material[i]["map"] = self.paintableTexture.RenderTarget.texture;
                        }
                    }
                }
            })

            gltf.scene.scale.set(scale,scale,scale);
            self.rootNode.add(gltf.scene);
            this.gltf = gltf.scene;
            
            if(gltf.animations.length > 0){
                self.animationMixer = new THREE.AnimationMixer(gltf.scene);
                //self.animationMixer.clipAction(gltf.animations[0]).play();
            }
        })
    }

    scenePicker(scene: THREE.Scene, camera, cursorPosition): THREE.Vector3 {
        this.raycaster.setFromCamera(cursorPosition, camera);
        
        let intersections = this.raycaster.intersectObjects(this.rootNode.children[0].children,true);
        if (intersections!.length > 0) {
            return intersections[0].point;
        }
        return null;
    }


    update() {
        let dt = this.clock.getDelta();
        this.camera.position.set(0,0,0);
        this.camera.rotateY(0.6 * dt);
        this.camera.translateZ(8);
        this.camera.updateProjectionMatrix();


        this.input.pointers.forEach((value,key)=>{
            if(value.isDown){
                this.Paint(value.position);
            }
        }) 
        if(this.paintableTexture.dirty){
            this.paintableTexture.Paint(this.renderer,this.camera,this.rootNode,new THREE.Vector3(0,10000,0));
        }

        this.renderer.render(this, this.camera);

        if(this.foldoutMaterial)
        {
            this.foldoutMaterial["uniforms"].uTime.value += 0.01;
            this.foldoutMaterial.needsUpdate = true;
        }

        if(this.animationMixer)
        {
            this.animationMixer.update(dt);
        }

    }

    Paint(cursorPostion:THREE.Vector2){
        let pos = this.scenePicker(this, this.camera, cursorPostion);

        if (!pos) {
            return;
        }
        this.paintableTexture.Paint(this.renderer,this.camera, this.rootNode, pos);
    }

   
    changeState(pageIndex: number) {
        if (pageIndex == this.currentPage) {
            return;
        }

        //Exit state
        switch (this.currentPage) {
            case 0: {
                break;
            }
            default: {
                break;
            }
        }

        this.currentPage = pageIndex;
        switch (this.currentPage) {
            case 0: {
                break;
            }
            default: {
                break;
            }
        }
    }

    recieveMessage(call: string, args: any) {
        this[call](args);
    }

    /**
     * Given a ThreeJS camera and renderer, resizes the scene if the
     * browser window is resized.
     * @param camera - a ThreeJS PerspectiveCamera object.
     * @param renderer - a subclass of a ThreeJS Renderer object.
     */
    static addWindowResizing(camera: THREE.PerspectiveCamera, renderer: THREE.Renderer) {
        window.addEventListener('resize', onWindowResize, false);
        function onWindowResize() {

            // uses the global window widths and height
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
}