import * as THREE from 'three';
import {GUI} from 'dat.gui';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import DemoBase from '../../../SceneBase';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

import model from "../../../shared/assets/models/smooth_suzanne.glb"

/**
 * A class to set up some basic scene elements to minimize code in the
 * main execution file.
 */
export default class LowResScene extends DemoBase{
   
    recieveMessage(call: string, args: any) {
        throw new Error('Method not implemented.');
    }

    // A dat.gui class debugger that is added by default
    gui: GUI = null;

    // Setups a scene camera
    camera: THREE.PerspectiveCamera = null;

    // setup renderer
    renderer: THREE.WebGLRenderer = null;
    material: THREE.ShaderMaterial = null;

    width = window.innerWidth;
    height = window.innerHeight;

    sceneRenderTarget: THREE.WebGLRenderTarget;
    copyRenderTarget: THREE.WebGLRenderTarget;

    blitQuad: THREE.Mesh;
    wsQuad: THREE.Mesh;

    orbitals: OrbitControls = null;

    scene: THREE.Scene = new THREE.Scene();

    initialize(debug: boolean = true, addGridHelper: boolean = true){
        window["scene"] = this;
       
        this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, .1, 100);
        this.camera.position.z = 8;
        this.camera.lookAt(0,0,0);

        

        const light = new THREE.DirectionalLight(0xffffff, 5);
        light.position.set(4, 10, 10);
        this.scene.add(light);
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0xfdaa91, 2.0));

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById("app") as HTMLCanvasElement,
            alpha: true
        });
        
        this.renderer.setSize(this.width, this.height);

        this.orbitals = new OrbitControls(this.camera, this.renderer.domElement)

        this.sceneRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height);
        this.copyRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height);
        this.addWindowResizing();
        
        // set the background color
        //this.background = new THREE.Color(0x9f88);
        const geometry = new THREE.PlaneGeometry();
 
        //Load demo model
        let gltfLoader = new GLTFLoader();
        gltfLoader.load(model, (gltf)=>{
            let bounds = new THREE.Box3().setFromObject(gltf.scene);
            let boundsSize = bounds.getSize(new THREE.Vector3())
            let scale = 3.0/Math.max(boundsSize.x, boundsSize.y, boundsSize.z);

            let center = bounds.getCenter(new THREE.Vector3());
            center = center.multiplyScalar(-scale);
            gltf.scene.position.copy(center);
            gltf.scene.scale.set(scale,scale,scale);
            //gltf.scene.rotateY(Math.PI / 2.0)
            this.scene.add(gltf.scene);
        });
     

        //Load blitter
        this.blitQuad = new THREE.Mesh(geometry, new THREE.ShaderMaterial(
        {
            vertexShader:
            `
                varying vec2 vUv;
                void main(){        
                    vUv = uv;              
                    gl_Position = vec4(uv * 2.0 - 1.0, 0, 1.0);
                }                  
            `,
            fragmentShader:
            `
                varying vec2 vUv;
                uniform sampler2D map;
  
                void main() {
                    gl_FragColor = texture2D( map, vUv );
                }
            `,

            uniforms:{
                map:{value:this.sceneRenderTarget.texture},
            },
            depthTest: false,
            depthWrite: false
        }));
        
        //Load low res filter that shows up on mesh
        this.wsQuad = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
            vertexShader:
            `
                varying vec2 screenUv;

                void main()
                {
                    vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    gl_Position = pos;

                    screenUv = (pos.xy / pos.w + vec2(1.0,1.0)) * 0.5;
                }
            `,

            fragmentShader:
            `
                varying vec2 screenUv;
                uniform sampler2D map;
                uniform float aspect;

                void main() {
                
                    float res = 64.0;
                    vec2 aspectCorrectedUv = vec2(screenUv.x, screenUv.y);
                    vec2 steppedUv = floor(aspectCorrectedUv * vec2(res * aspect, res))/vec2(res * aspect,res);
                    //vec2 steppedUv = floor(screenUv * res)/res;

                    gl_FragColor = texture2D(map, steppedUv) + vec4(0.01,0.01,0.01,0);
                    //gl_FragColor = vec4(steppedUv, 0.0, 1.0) ; 
                }
            `,

            uniforms:
            {
                map: {value: this.copyRenderTarget.texture},
                aspect: {value: this.camera.aspect}
            }
        }))

        this.wsQuad.scale.set(2,2,1);
        this.wsQuad.position.set(0,0,2);
        console.log(this.camera.aspect);
        this.initStandaloneGUI();
    }




    update(){
        this.orbitals.update();
        this.camera.updateProjectionMatrix();

        
        this.renderer.setRenderTarget(this.sceneRenderTarget);
        this.renderer.render(this.scene, this.camera);

        this.renderer.autoClear = false;


        this.renderer.setRenderTarget(this.copyRenderTarget);
        this.renderer.render(this.blitQuad, this.camera);

        this.renderer.setRenderTarget(this.sceneRenderTarget);
        this.renderer.render(this.wsQuad, this.camera);

        this.renderer.setRenderTarget(null);
        this.renderer.render(this.blitQuad, this.camera);

        this.renderer.autoClear = true;
    }

    addWindowResizing()
    {
        let self = this;
        window.addEventListener( 'resize', onWindowResize, false );
        function onWindowResize(){

            // uses the global window widths and height
            self.camera.aspect = window.innerWidth / window.innerHeight;
            self.camera.updateProjectionMatrix();
            self.renderer.setSize( window.innerWidth, window.innerHeight );

            self.sceneRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
            self.copyRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

            self.blitQuad.material["uniforms"].map.value = self.sceneRenderTarget.texture;
            self.wsQuad.material["uniforms"].map.value = self.copyRenderTarget.texture;
            self.wsQuad.material["uniforms"].aspect.value = self.camera.aspect;
        }
    }

    initStandaloneGUI(){
        //this.gui = new GUI();      
    }
}