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

import GlbTest from "../models/CesiumMan.glb"
import { PaintableTexture } from '../../../shared/meshpainting/scripts/PaintableSurface';


/**
 * A class to set up some basic scene elements to minimize code in the
 * main execution file.
 */
export default class WhiteboardDemoScene extends SceneBase {a
    debugger: GUI = null;

    camera: THREE.PerspectiveCamera = null;
    renderer: THREE.WebGLRenderer = null;
    orbitals: OrbitControls = null;
    material: THREE.Material = null;

    // Get some basic params
    width = window.innerWidth;
    height = window.innerHeight;


    currentPage = 0;

    // renderTarget: THREE.WebGLRenderTarget;
    // lowResRenderTarget: THREE.WebGLRenderTarget;

    sphere: THREE.Mesh;
    raycaster: THREE.Raycaster;
    pickPosition = { x: 0, y: 0 };

    brushPos = new THREE.Vector3(0,0,0);
    paintMaterial: THREE.ShaderMaterial;

    input:InputManager;

    rootNode: THREE.Object3D;

    clock:THREE.Clock;

    animationMixer: THREE.AnimationMixer;

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
    }
 
    private setupScene() {
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(4, 10, 10);
        this.add(light);
        
        // const light2 = new THREE.DirectionalLight(0xfdaa91, 0.5);
        // light2.position.set(-4,-10,-10);
        // this.add(light2);
        this.add(new THREE.HemisphereLight(0xffffff, 0xff0000, 2.0))

        //this.add(new THREE.AmbientLight(0xfdaa91, 1));

        let cubemap = new THREE.CubeTextureLoader().load([CubeMap_px, CubeMap_nx, CubeMap_py, CubeMap_ny, CubeMap_pz, CubeMap_nz])
        //this.environment = cubemap;
        this.background = cubemap;
        //this.background = new THREE.Color("red");

        this.rootNode = new THREE.Object3D();
        this.add(this.rootNode);
     
        let gradientTex = new THREE.TextureLoader().load(GradientTexturePath);
        this.material = new CustomShaderMaterial({
            baseMaterial: THREE.MeshPhysicalMaterial,
            map: this.paintableTexture.RenderTarget.texture,
            vertexShader:PlanetShaderVert,
            fragmentShader:PlanetShaderFrag,
            uniforms:{
                uGradient:{value:gradientTex}
            }
        });

        

        let gltfLoader = new GLTFLoader();
        let self = this;
        this.groupTest = new THREE.Group();
        gltfLoader.load(GlbTest, (gltf)=>{
            let bounds = new THREE.Box3().setFromObject(gltf.scene);
            let boundsSize = bounds.getSize(new THREE.Vector3())
            let scale = 3.0/Math.max(boundsSize.x, boundsSize.y, boundsSize.z);

            let center = bounds.getCenter(new THREE.Vector3());
            center = center.multiplyScalar(-scale);
           
            let sp = new THREE.Mesh(new THREE.SphereGeometry(0.1));
            self.add(sp);
            sp.position.copy(center);
            
            gltf.scene.position.copy(center);

            gltf.scene.traverse(child=>{
                if(child instanceof THREE.Mesh)
                {
                    if(child.material as THREE.Material){
                        console.log(child.material);
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
            
            if(gltf.animations.length > 0){
                self.animationMixer = new THREE.AnimationMixer(gltf.scene);
                //self.animationMixer.clipAction(gltf.animations[0]).play();
            }
        })

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
                OUTPUT_BRUSHPOSITION: false
            }
        })

        this.add(new THREE.Mesh(new THREE.PlaneGeometry(), this.foldoutMaterial));
        
        // this.blitQuad = new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.ShaderMaterial({
        //     uniforms:{
        //         uMap:{value:this.renderTarget.texture},
        //     },
        //     vertexShader:PaintShaderVert,
        //     fragmentShader:
        //     `
        //         varying vec2 vUv;

        //         uniform sampler2D uMap;

        //         void main(){
        //             float step = 0.01;
        //             gl_FragColor =  texture2D(uMap, vUv) + 
        //                             (texture2D(uMap, vUv + vec2(-step,0.0)) +
        //                             texture2D(uMap, vUv + vec2(step,0.0) )+
        //                             texture2D(uMap, vUv + vec2(0.0,-step)) +
        //                             texture2D(uMap, vUv + vec2(0.0,step))) / 1.5
        //                             ;
        //         }
        //     `
        // }))
    }

    foldoutMaterial: THREE.Material;

    paintSurface: THREE.Object3D;
    blitQuad: THREE.Object3D;
    groupTest: THREE.Group;

   

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
        let self = this;

        this.camera.position.set(0,0,0);
        this.camera.rotateY(0.6 * dt);
        this.camera.translateZ(8);
        
        this.camera.updateProjectionMatrix();
        this.renderer.render(this, this.camera);

        if (this.rootNode) {
            //this.rootNode.rotateY(-0.001)
            //this.paintableSurface.rotateY(-0.001);
        }

        this.input.pointers.forEach((value,key)=>{
            if(value.isDown){
                this.Paint(value.position);
            }
        }) 

        if(this.foldoutMaterial)
        {
            this.foldoutMaterial["uniforms"].uTime.value += 0.01;
            this.foldoutMaterial.needsUpdate = true;
        }

        if(this.animationMixer)
        {
            this.animationMixer.update(dt);
            console.log(this.animationMixer);
        }
    }

    paintableTexture:PaintableTexture = new PaintableTexture(512,512);
    Paint(cursorPostion:THREE.Vector2){
        let pos = this.scenePicker(this, this.camera, cursorPostion);

        if (!pos) {
            return;
        }
        //this.paintMaterial.uniforms.brushPos.value = pos;
        
        this.paintableTexture.Paint(this.renderer,this.camera, this.rootNode, pos);
    }

    // private renderPaintScene() {
    //     this.renderer.autoClearColor = false;
    //     this.renderer.setRenderTarget(this.renderTarget);
    //     if(this.paintSurface)
    //         this.renderer.render(this.paintSurface, this.camera);

    //     this.renderer.setRenderTarget(this.lowResRenderTarget);
    //     this.renderer.render(this.blitQuad,this.camera)

    //     this.renderer.setRenderTarget(null);
    //     this.renderer.autoClearColor = true;   
    // }

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