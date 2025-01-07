import * as THREE from 'three';
import {GUI} from 'dat.gui';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import SceneBase from '../../../SceneBase';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

import model from "../../whiteboard/models/smooth_suzanne.glb"
import skybox from "../textures/tears_of_steel_bridge_2k.jpg";
import normalMap from "../textures/bumpyNormalMap.jpg";
import { Blitter } from '../../../shared/blitter/blit';
import refractionVS from "../shader/refraction.vs";
import refractionFS from "../shader/refraction.fs";

export default class RefractionScene extends SceneBase{
   
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

    orbitals: OrbitControls = null;
    blitter : Blitter = new Blitter();

    refractionGroup: THREE.Group;
    transparentScene: THREE.Scene;

    refractionMaterial: THREE.ShaderMaterial;

    initialize(debug: boolean = true, addGridHelper: boolean = true){
        window["scene"] = this;
       
        this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, .1, 100);
        this.camera.position.z = 8;
        this.camera.lookAt(0,0,0);

        const light = new THREE.DirectionalLight(0xffffff, 5);
        light.position.set(4, 10, 10);
        this.add(light);
        //this.add(new THREE.HemisphereLight(0xffffff, 0xfdaa91, 2.0));

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById("app") as HTMLCanvasElement,
            alpha: true
        });
        this.renderer.setSize(this.width, this.height);
        
        this.orbitals = new OrbitControls(this.camera, this.renderer.domElement)

        this.sceneRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {generateMipmaps:true});
        this.copyRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {generateMipmaps:true});
        this.addWindowResizing();
 
       
        
        this.refractionMaterial = new THREE.ShaderMaterial({
            vertexShader: refractionVS,
            fragmentShader: refractionFS,
            uniforms: {
                map: {value:this.copyRenderTarget.texture},
                normalMap: {value:null},
                refractionIndex: {value:-1},
                strength: {value:0.3}
            },
            depthWrite:false
        })

        

        let self = this;
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

            gltf.scene.traverse((child)=>{
                if(child instanceof THREE.Mesh)
                    child.material = self.refractionMaterial; 
            });

            //this.refractionGroup.add(gltf.scene);
        });
     
        
        this.refractionGroup = new THREE.Group();

        let geo = new THREE.SphereGeometry(1);
        geo.computeTangents();
        let sphere = new THREE.Mesh(geo, this.refractionMaterial);
        this.refractionGroup.add(sphere);

        this.transparentScene = new THREE.Scene();
        let pbrGlassMat = new THREE.MeshPhysicalMaterial({
            transparent:true,
            color: new THREE.Color('#FFFFFF'),
            opacity: 0.1,
            metalness: 1.0,
            roughness:0.0
        })
        this.transparentScene.add( new THREE.Mesh(geo,pbrGlassMat ))
       // this.transparentScene.add(light);
       
        const loader = new THREE.TextureLoader();
        loader.load(normalMap, (tex)=>{
            this.refractionMaterial.uniforms.normalMap.value = tex;
            pbrGlassMat.normalMap = tex;
        })
        //this.background = new THREE.Color('red');
        const texture = loader.load(
            skybox,
            () => {
              texture.mapping = THREE.EquirectangularReflectionMapping;
              //texture.colorSpace = THREE.SRGBColorSpace;
              self.background = texture;
              self.environment = texture;
              self.transparentScene.environment = texture;
            
            });
        
        this.webcamFeed = document.createElement('video');
        this.webcamFeed.style.display = "none";
        document.body.appendChild(this.webcamFeed);
        this.initStandaloneGUI();
    }
    webcamFeed: HTMLVideoElement;

    update(){
        this.orbitals.update();
        this.camera.updateProjectionMatrix();

        this.renderer.setRenderTarget(this.sceneRenderTarget);
        this.renderer.render(this, this.camera);
        this.renderer.autoClear = false;
        
        this.blitter.blit(this.sceneRenderTarget.texture, this.copyRenderTarget, this.renderer, this.camera);
        this.renderer.render(this.refractionGroup, this.camera);

        this.renderer.render(this.transparentScene, this.camera);
        
        this.renderer.setRenderTarget(null);
        this.blitter.copyToActiveRenderTarget(this.sceneRenderTarget.texture, this.renderer, this.camera);

        this.renderer.autoClear = true;


    }

    initWebcam()
    {
        let self= this;
        if ( navigator.mediaDevices && navigator.mediaDevices.getUserMedia ) 
            {
  
            navigator.mediaDevices.getUserMedia( { video: {facingMode:"environment"} } ).then( stream => {
            
                self.webcamFeed.srcObject = stream;
                self.webcamFeed.play();
                const texture = new THREE.VideoTexture( self.webcamFeed );
                self.background = texture;
            } 
        );
            
        }
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
            self.refractionMaterial.uniforms.map.value = self.copyRenderTarget.texture;   
        }
    }

    initStandaloneGUI(){
        this.gui = new GUI();  
        this.gui.add(this.refractionMaterial.uniforms.refractionIndex, "value",-1,1,0.01).name("Refraction index");
        this.gui.add(this.refractionMaterial.uniforms.strength, "value").name("Strength");    
        this.gui.add(this, 'initWebcam');
    }
}