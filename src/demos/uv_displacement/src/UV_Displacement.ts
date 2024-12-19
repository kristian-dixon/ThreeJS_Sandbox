import * as THREE from 'three';
import {GUI} from 'dat.gui';


import FireVertexShader from "../shaders/fire.vs"
import FireFragmentShader from "../shaders/fire.fs";


import FireTex from "../textures/fire.png"
import FlowTex from "../textures/flowmap.png"
import SceneBase from '../../../SceneBase';
import { PaintableTexture } from '../../../shared/meshpainting/scripts/PaintableSurface';
import { DepthPick } from '../../../shared/picking/depthpick';
import { InputManager, Pointer } from '../../../shared/input/InputManager';

/**
 * A class to set up some basic scene elements to minimize code in the
 * main execution file.
 */
export default class UVDisplacementScene extends SceneBase{
   
    recieveMessage(call: string, args: any) {
        throw new Error('Method not implemented.');
    }

    // A dat.gui class debugger that is added by default
    debugger: GUI = null;

    // Setups a scene camera
    camera: THREE.PerspectiveCamera = null;

    // setup renderer
    renderer: THREE.WebGLRenderer = null;
    material: THREE.ShaderMaterial = null;

    width = window.innerWidth;
    height = window.innerHeight;

    cube: THREE.Mesh;

    clock:THREE.Clock;

    paintableTexture: PaintableTexture = new PaintableTexture(512,512, {BrushSettings:{brushRadius:{value:0.05}, blendStrength:{value:0.125}}});
    depthPicker: DepthPick;

    input:InputManager;

    initialize(debug: boolean = true, addGridHelper: boolean = true){
        this.input = InputManager.Get();
        this.clock = new THREE.Clock(true);
        this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, .1, 100);
        this.camera.position.z = 8;
        this.camera.lookAt(0,0,0);

        this.depthPicker = new DepthPick(this.camera);

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById("app") as HTMLCanvasElement,
            alpha: true
        });

        this.renderer.setSize(this.width, this.height);

        UVDisplacementScene.addWindowResizing(this.camera, this.renderer);
        
        // set the background color
        this.background = new THREE.Color(0xFFFF00);
        const geometry = new THREE.BoxGeometry(1, 1, 1);

        let fireTex = new THREE.TextureLoader().load(FireTex); 
        fireTex.wrapS = THREE.RepeatWrapping;
        fireTex.wrapT = THREE.RepeatWrapping;

        let dispTex = new THREE.TextureLoader().load(FlowTex);
        dispTex.wrapS = THREE.RepeatWrapping;
        dispTex.wrapT = THREE.RepeatWrapping;

        this.material = new THREE.ShaderMaterial({
            uniforms:{
                Time: {value:0.0},
                displacementStr:{value:0.3},
                verticalStrength:{value:3.6},
                scrollSpeed:{value: new THREE.Vector2(0.4, -1)},
                displacementUVScale:{value: new THREE.Vector2(5, 2.6)},
                mainTex: {value:this.paintableTexture.RenderTarget.texture},
                dispTex: {value:dispTex}

            },
            vertexShader: FireVertexShader,
            fragmentShader: FireFragmentShader,
        })

        this.cube = new THREE.Mesh(geometry, this.material);
        this.add(this.cube);
        
       
        this.initStandaloneGUI();
    }

    

    loadTexture(url:string){
        var loader = new THREE.TextureLoader();
        loader.setCrossOrigin("");
        let fireTex = loader.load(url);
        fireTex.wrapS = THREE.RepeatWrapping;
        fireTex.wrapT = THREE.RepeatWrapping;
        this.material.uniforms["mainTex"].value = fireTex;
        this.material.needsUpdate = true;
    }

    update(){
        this.camera.updateProjectionMatrix();
        this.renderer.render(this, this.camera);
        

        if(this.material){
            this.material.uniforms["Time"]["value"] += 0.016;
            this.material.needsUpdate = true;
        }

        this.input.pointers.forEach((value,key)=>{ 
            if(value.isDown){
                this.Paint(value);
            }
        }) 
    }

    Paint(pointerInfo:Pointer){
        //let pos = this.scenePicker(this, this.camera, cursorPostion);
        if (!pointerInfo) {
            return;
        }

        let depth = this.depthPicker.pick(pointerInfo.cssPosition, this, this.renderer, this.camera);
        if(depth >= (this.camera.far - (this.camera.far * 0.001)))
        {
            //Probably casting against the skybox
            return;
        }

        let remappedDepth = (depth*2)-1.0;
        let pos = new THREE.Vector3(pointerInfo.position.x, pointerInfo.position.y,remappedDepth).unproject(this.camera);
        this.paintableTexture.Paint(this.renderer,this.camera, this.cube, pos);
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



    initStandaloneGUI(){
        this.debugger =  new GUI();

        const materialSettingsGroup = this.debugger.addFolder("Material Properties");
        const uvScrollGroup = materialSettingsGroup.addFolder("UV Scroll Speed");
        uvScrollGroup.add(this.material.uniforms["scrollSpeed"].value, "x");
        uvScrollGroup.add(this.material.uniforms["scrollSpeed"].value, "y");

        const uvScaleGroup = materialSettingsGroup.addFolder("Flow UV Scale");
        uvScaleGroup.add(this.material.uniforms["displacementUVScale"].value, "x");
        uvScaleGroup.add(this.material.uniforms["displacementUVScale"].value, "y");

        materialSettingsGroup.add(this.material.uniforms["displacementStr"],"value").name("Displacement Strength");
        materialSettingsGroup.add(this.material.uniforms["verticalStrength"],"value").name("Vertical Falloff");

        let mainTexUploader = document.createElement("input")
        mainTexUploader.type = "file" 
        mainTexUploader.accept = "image/*"
        mainTexUploader.style.visibility="hidden";

        let self = this;
        mainTexUploader.addEventListener("change", (evt)=>{
            var userImageURL = URL.createObjectURL( mainTexUploader.files[0] );
            
            self.loadTexture(userImageURL);
            
        })

        let buttonsFuncs = {
            mainTex:function(){
                mainTexUploader.click();
            }
        }
        materialSettingsGroup.add(buttonsFuncs, "mainTex").name("Set main texture")
    }
}