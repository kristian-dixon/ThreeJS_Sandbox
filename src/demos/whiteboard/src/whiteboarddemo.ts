import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import PaintShaderVert from "../shaders/paintbrush.vs";
import PaintShaderFrag from "../shaders/paintbrush.fs";

import PlanetShaderVert from "../shaders/planet/vertex.vs"
import PlanetShaderFrag from "../shaders/planet/frag.fs"

import GradientTexturePath from "../textures/SeaLandAirGradient.png";

import SceneBase from '../../../SceneBase';
import { InputManager } from '../../../shared/input/InputManager';

import CSM, { CSMProxy } from "three-custom-shader-material/vanilla"
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

import CubeMap_nx from "../textures/cubemap/nx.png";
import CubeMap_ny from "../textures/cubemap/ny.png";
import CubeMap_pz from "../textures/cubemap/nz.png";
import CubeMap_px from "../textures/cubemap/px.png";
import CubeMap_py from "../textures/cubemap/py.png";
import CubeMap_nz from "../textures/cubemap/pz.png";



/**
 * A class to set up some basic scene elements to minimize code in the
 * main execution file.
 */
export default class WhiteboardDemoScene extends SceneBase {
    debugger: GUI = null;

    camera: THREE.PerspectiveCamera = null;
    renderer: THREE.WebGLRenderer = null;
    orbitals: OrbitControls = null;
    material: THREE.Material = null;

    // Get some basic params
    width = window.innerWidth;
    height = window.innerHeight;

    visibleModel: THREE.Mesh;

    currentPage = 0;

    renderTarget: THREE.WebGLRenderTarget;
    rtCamera: THREE.Camera;
    rtScene: THREE.Scene;

    paintableSurface: THREE.Mesh;
    sphere: THREE.Mesh;
    raycaster: THREE.Raycaster;
    pickPosition = { x: 0, y: 0 };

    brushPos = new THREE.Vector3(0,0,0);
    paintMaterial: THREE.ShaderMaterial;

    input:InputManager;

    

    initialize(debug: boolean = true, addGridHelper: boolean = true) {
        
        this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, .1, 100);
        this.camera.position.z = 8;
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById("app") as HTMLCanvasElement,
            alpha: true, 
           // preserveDrawingBuffer:true -- this is for the canvas
        });
        this.renderer.setSize(this.width, this.height);

        this.intializeRenderTexture();
        this.background = new THREE.Color(0x000000);



        this.setupScene();

        this.input=InputManager.Get();
        this.raycaster = new THREE.Raycaster();
        WhiteboardDemoScene.addWindowResizing(this.camera, this.renderer);
        this.renderPaintScene();
    }


    private setupScene() {
        const light = new THREE.DirectionalLight(new THREE.Color(1, 1, 1), 2);
        light.position.set(4, 10, 10);
        this.add(light);
        this.add(new THREE.AmbientLight(new THREE.Color(1, 1, 1), 0.2));


        let cubemap = new THREE.CubeTextureLoader().load([CubeMap_px, CubeMap_nx, CubeMap_py, CubeMap_ny, CubeMap_pz, CubeMap_nz])
        this.environment = cubemap;
        this.background = cubemap;
        


        let gradientTex = new THREE.TextureLoader().load(GradientTexturePath);
        this.material = new CustomShaderMaterial({
            baseMaterial: THREE.MeshPhysicalMaterial,
            map: this.renderTarget.texture,
            vertexShader:PlanetShaderVert,
            fragmentShader:PlanetShaderFrag,
            uniforms:{
                uGradient:{value:gradientTex}
            }
        });

        const geometry = new THREE.SphereGeometry(1);
        this.visibleModel = new THREE.Mesh(geometry, this.material);
        this.add(this.visibleModel);

        let quad = new THREE.Mesh(new THREE.PlaneGeometry(10,10), new THREE.ShaderMaterial({
            vertexShader:
            `
                varying vec2 vUv;
                void main()	{
                    vUv = uv.xy * 2.0 - 1.0;                   
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }
            `,

            fragmentShader:
            `
                uniform vec2 windowResolution;
                varying vec2 vUv;
                void main()	{
                    vec2 pixelUv = vUv;
                    float length = (1.0/length(vUv*5.0));
                    length = 1.0-pow(1.0-length, 0.1);
                    length *= 0.5 * (dot(vUv, vec2(1,1)) + 1.0);

                    length *= 1.0;
                    gl_FragColor = vec4(length,length,length,length*4.0);
                }
            `,

            uniforms:{
                windowResolution:{value: new THREE.Vector2(window.innerWidth,window.innerHeight)}
            },
            transparent:true
        }))
       
        this.add(quad);


        this.paintMaterial = new THREE.ShaderMaterial({
            uniforms: {
                brushPos: { value: this.brushPos }
            },
            vertexShader: PaintShaderVert,
            fragmentShader: PaintShaderFrag,
            blending: THREE.AdditiveBlending
        });
        this.paintableSurface = new THREE.Mesh(geometry, this.paintMaterial);
        this.rtScene.add(this.paintableSurface);


    }

    private intializeRenderTexture() {
        const rtWidth = 512;
        const rtHeight = 512;
        this.renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight);
        this.rtCamera = new THREE.PerspectiveCamera();

        this.rtScene = new THREE.Scene();
        this.rtScene.background = new THREE.Color('Blue');
    }

    scenePicker(scene: THREE.Scene, camera, cursorPosition): THREE.Vector3 {
        this.raycaster.setFromCamera(cursorPosition, camera);
        let intersections = this.raycaster.intersectObjects(scene.children.filter((x) => x == this.visibleModel));

        if (intersections!.length > 0) {

            return intersections[0].point;
        }
        return null;
    }

    update() {
        let self = this;

        this.camera.updateProjectionMatrix();
        this.renderer.render(this, this.camera);

        if (this.visibleModel) {
            this.visibleModel.rotateY(-0.001)
            this.paintableSurface.rotateY(-0.001);
        }


        this.input.pointers.forEach((value,key)=>{
            if(value.isDown){
                this.Paint(value.position);
            }
        })

        // if(this.input.mouse.buttons[0])
        // {
        //     this.paintMaterial.blending = THREE.AdditiveBlending;
        //     this.Paint(this.input.mouse.position);
        // }

        // if(this.input.mouse.buttons[2])
        // {
        //     this.paintMaterial.blending = THREE.SubtractiveBlending;
        //     this.Paint(this.input.mouse.position);
        // }
        
        // for(let i = 0; i < this.input.touchManager.touches.length;i++){
        //     let touch = this.input.touchManager.touches[i];
        //     if(touch && touch.isHeld){
        //         this.Paint(touch.position);
        //     }
        // }
    }

    Paint(cursorPostion:THREE.Vector2){
        let pos = this.scenePicker(this, this.camera, cursorPostion);

        if (!pos) {
            return;
        }
        this.paintMaterial.uniforms.brushPos.value = pos;

        this.renderPaintScene();
    }

    private renderPaintScene() {
        this.renderer.autoClearColor = false;
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.rtScene, this.camera);
        this.renderer.setRenderTarget(null);
        this.renderer.autoClearColor = true;
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