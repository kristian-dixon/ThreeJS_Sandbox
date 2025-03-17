import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import DemoBase from '../../../SceneBase';
import model from "../../../shared/assets/models/smooth_suzanne.glb"
import { OrbitalCamera } from '../../../shared/generic_scene_elements/camera';
import { DefaultLighting } from '../../../shared/generic_scene_elements/lighting';
import { ScreenspaceRenderTarget } from '../../../shared/generic_scene_elements/screenspace_rendertarget';

/**
 * A class to set up some basic scene elements to minimize code in the
 * main execution file.
 */
export default class LowResScene extends DemoBase{
    // Setups a scene camera
    camera: OrbitalCamera;

    material: THREE.ShaderMaterial = null;


    sceneRenderTarget: ScreenspaceRenderTarget;
    copyRenderTarget: ScreenspaceRenderTarget;

    blitQuad: THREE.Mesh;
    wsQuad: THREE.Mesh;


    scene: THREE.Scene = new THREE.Scene();

    initialize(){
        this.camera = new OrbitalCamera(35, .1, 100, this.renderer);
        this.camera.setTarget(new THREE.Vector3(0,0,-2.5));
        this.camera.position.set(0,0,1);
        this.scene.position.set(0,0,-2.5);

        DefaultLighting.SetupDefaultLighting(this.scene);
        
        this.sceneRenderTarget = new ScreenspaceRenderTarget(new THREE.Vector2(1,1));
        this.copyRenderTarget = new ScreenspaceRenderTarget(new THREE.Vector2(1,1));

        //Load demo model
        let gltfLoader = new GLTFLoader();
        gltfLoader.load(model, (gltf)=>{
            let bounds = new THREE.Box3().setFromObject(gltf.scene);
            let boundsSize = bounds.getSize(new THREE.Vector3())
            let scale = 1.0/Math.max(boundsSize.x, boundsSize.y, boundsSize.z);

            let center = bounds.getCenter(new THREE.Vector3());
            center = center.multiplyScalar(-scale);
            gltf.scene.position.copy(center);
            gltf.scene.scale.set(scale,scale,scale);
            this.scene.add(gltf.scene);
        });
     
        const geometry = new THREE.PlaneGeometry(.7,.7, 32,32);
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
        this.blitQuad.frustumCulled = false;
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

        this.copyRenderTarget.subscribeToRefresh(()=>{
            this.wsQuad.material["uniforms"].map.value = this.copyRenderTarget.texture;
            this.wsQuad.material["uniforms"].aspect.value = this.copyRenderTarget.renderTarget.width/this.copyRenderTarget.renderTarget.height;
        })
        
        this.sceneRenderTarget.subscribeToRefresh(()=>{
            this.blitQuad.material["uniforms"].map.value = this.sceneRenderTarget.texture;
        })

        this.wsQuad.position.set(0,0,-2.15);
        this.initStandaloneGUI();
    }




    update(){
        this.renderer.setRenderTarget(this.sceneRenderTarget.renderTarget);
        this.renderer.render(this.scene, this.camera);

        this.renderer.autoClear = false;

        this.renderer.setRenderTarget(this.copyRenderTarget.renderTarget);
        this.renderer.render(this.blitQuad, this.camera);

        this.renderer.setRenderTarget(this.sceneRenderTarget.renderTarget);
        this.renderer.render(this.wsQuad, this.camera);

        this.renderer.setRenderTarget(null);
        this.renderer.render(this.blitQuad, this.camera);


        this.renderer.autoClear = true;
    }

    // addWindowResizing()
    // {
    //     let self = this;
    //     window.addEventListener( 'resize', onWindowResize, false );
    //     function onWindowResize(){

    //         // uses the global window widths and height
    //         self.camera.aspect = window.innerWidth / window.innerHeight;
    //         self.camera.updateProjectionMatrix();
    //         self.renderer.setSize( window.innerWidth, window.innerHeight );

    //         self.sceneRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    //         self.copyRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    //         self.blitQuad.material["uniforms"].map.value = self.sceneRenderTarget.texture;
    //         self.wsQuad.material["uniforms"].map.value = self.copyRenderTarget.texture;
    //         self.wsQuad.material["uniforms"].aspect.value = self.camera.aspect;
    //     }
    // }

    initStandaloneGUI(){
        //this.gui = new GUI();      
    }
}