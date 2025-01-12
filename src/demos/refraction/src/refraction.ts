import * as THREE from 'three';
import {GUI} from 'dat.gui';
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import SceneBase from '../../../SceneBase';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

import model from "../../whiteboard/models/gem.glb"
import skybox from "../textures/tears_of_steel_bridge_2k.jpg";
import normalMap from "../textures/bumpyNormalMap.jpg";
import { Blitter } from '../../../shared/blitter/blit';
import refractionVS from "../shader/refraction.vs";
import refractionFS from "../shader/refraction.fs";
import normalBuffer from "../shader/normalBuffer.fs";

export default class RefractionScene extends SceneBase{
   
    recieveMessage(call: string, args: any) {
        this.dispatchEvent({type:call, message:args});
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

    backfaceNormalRenderTarget: THREE.WebGLRenderTarget;

    orbitals: OrbitControls = null;
    blitter : Blitter = new Blitter();

    refractionGroup: THREE.Group;
    transparentScene: THREE.Scene;

    webcamFeed: HTMLVideoElement;

    initialize(debug: boolean = true, addGridHelper: boolean = true){
        window["scene"] = this;
        this.initStandaloneGUI();

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
       

        this.refractionGroup = new THREE.Group();
        this.initRefractionEffect();

        this.transparentScene = new THREE.Scene();
        this.initGlassEffect();
        

        let self = this;
        let gltfLoader = new GLTFLoader();
        gltfLoader.load(model, (gltf)=>{
            let bounds = new THREE.Box3().setFromObject(gltf.scene);
            let boundsSize = bounds.getSize(new THREE.Vector3())
            let scale = 3.0/Math.max(boundsSize.x, boundsSize.y, boundsSize.z);

            let center = bounds.getCenter(new THREE.Vector3());
            center = center.multiplyScalar(-scale);
            gltf.scene.position.copy(center);
            gltf.scene.scale.set(scale,scale,scale);

            this.dispatchEvent({type:"GltfLoaded", message:gltf})  
        });  
        
        const loader = new THREE.TextureLoader();
        loader.load(normalMap, (tex)=>{
            this.dispatchEvent({type:"NormalMapLoaded", message:tex})
        })

        //this.background = new THREE.Color('red');
        const texture = loader.load(
            skybox,
            () => {
              texture.mapping = THREE.EquirectangularReflectionMapping;
              self.background = texture;
              self.environment = texture;
              self.transparentScene.environment = texture;
            });
        
        this.webcamFeed = document.createElement('video');
        this.webcamFeed.style.display = "none";
        document.body.appendChild(this.webcamFeed);
    }

    initRefractionEffect(){
        let material = new THREE.ShaderMaterial({
            vertexShader: refractionVS,
            fragmentShader: refractionFS,
            uniforms: {
                map: {value:this.copyRenderTarget.texture},
                normalMap: {value:null},
                refractionIndexR: {value:-1},
                refractionIndexG: {value:-1},
                refractionIndexB: {value:-1},
                strength: {value:0.3},
                normalMapStrength: {value:0.0},
                tint: {value:new THREE.Color('white')},
            },
            depthWrite:false
        })

        let geo = new THREE.SphereGeometry(1);
        geo.computeTangents();
        let sphere = new THREE.Mesh(geo, material);
        this.refractionGroup.add(sphere);

        this.addEventListener('NormalMapLoaded', (evt)=>{
            material.uniforms.normalMap.value = evt.message;
        });

        let gem = null;
        this.addEventListener('GltfLoaded', (evt)=>{
            let gltf = evt.message as GLTF;
            let clone = gltf.scene.clone();

            gem = clone;
            this.refractionGroup.add(gem);

            if(sphere.visible){
                gem.visible = false;
            }

            clone.traverse((child)=>{
                if(child instanceof THREE.Mesh)
                {
                    (child.geometry as THREE.BufferGeometry).computeTangents();
                    child.material = material; 
                }
            });
        });

        this.addEventListener('SwapModel', ()=>{
            gem.visible = sphere.visible;
            sphere.visible = !sphere.visible;
        });

        if(this.gui){
            let refractionProps = this.gui.addFolder('Refraction Settings');
            refractionProps.add(material.uniforms.refractionIndexR, "value",-1,1,0.01).name("R Refraction");
            refractionProps.add(material.uniforms.refractionIndexG, "value",-1,1,0.01).name("G Refraction");
            refractionProps.add(material.uniforms.refractionIndexB, "value",-1,1,0.01).name("B Refraction");
            refractionProps.add(material.uniforms.strength, "value",-2,2,0.01).name("Strength");  
            refractionProps.add(material.uniforms.normalMapStrength, "value",-2,2,0.01).name("Normal Map Strength");
            refractionProps.add(this, "changeModel");
            let tint = refractionProps.addColor(this, 'tempColor');
            tint.onChange(()=>{
                material.uniforms.tint.value = new THREE.Color(this.tempColor);
                material.needsUpdate = true;
            });
        }
    }

    initGlassEffect(){
        let material = new THREE.MeshPhysicalMaterial({
            transparent:true,
            color: new THREE.Color('#FFFFFF'),
            opacity: 0.03,
            metalness: 1.0,
            roughness:0.0,
            normalScale:new THREE.Vector2(0.1,0.1)
        })

        let geo = new THREE.SphereGeometry(1);
        geo.computeTangents();

        let sphere = new THREE.Mesh(geo, material);
        this.transparentScene.add(sphere);

        this.addEventListener('NormalMapLoaded', (evt)=>{
            material.normalMap = evt.message;
        });

        let gem = null;
        this.addEventListener('GltfLoaded', (evt)=>{
            let gltf = evt.message as GLTF;
            let clone = gltf.scene.clone();
            gem = clone;
            this.transparentScene.add(clone);

            if(sphere.visible){
                clone.visible = false;
            }

            clone.traverse((child)=>{
                if(child instanceof THREE.Mesh)
                {
                    (child.geometry as THREE.BufferGeometry).computeTangents();
                    child.material = material; 
                }
            });
        });

        this.addEventListener('SwapModel', ()=>{
            gem.visible = sphere.visible;
            sphere.visible = !sphere.visible;
        });

        if(this.gui){
            let folder = this.gui.addFolder('TransparencySettings');
            folder.add(material,"opacity");
        }
    }

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

    changeModel()
    {
        this.dispatchEvent({type:'SwapModel'})
        //this.gltf.visible = this.sphere.visible;
        //this.sphere.visible = !this.sphere.visible;
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
            self.backfaceNormalRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {generateMipmaps:true});

            self.dispatchEvent({type:'RefreshRTMaterials'});
            //self.refractionMaterial.uniforms.map.value = self.copyRenderTarget.texture;   
            //self.refractionMaterial.uniforms.backfaceNormals.value = self.backfaceNormalRenderTarget.texture;   
        }
    }

    tempColor:string = "#FFFFFF";
    initStandaloneGUI(){
        this.gui = new GUI();  
        //this.gui.add(this.refractionMaterial.uniforms.refractionIndex, "value",-1,1,0.01).name("Refraction index");
        
        // brushColor.onChange(()=>{
        //     this.paintableTexture.SetColor(this.paintableTexture.brushColor);
        // });
        // brushColor.setValue(0xff0000)
        // brushColor.name("Colour");

        this.gui.add(this, 'initWebcam');
    }
}