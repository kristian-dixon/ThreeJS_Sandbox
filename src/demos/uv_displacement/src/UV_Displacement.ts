import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass'



import {GUI} from 'dat.gui';


import FireVertexShader from "../shaders/fire.vs"
import FireFragmentShader from "../shaders/fire.fs";


import FireTex from "../textures/fire2.png"
import FlowTex from "../textures/flowmap.png"
import SceneBase from '../../../SceneBase';
import { PaintableTexture } from '../../../shared/meshpainting/scripts/PaintableSurface';
import { DepthPick } from '../../../shared/picking/depthpick';
import { InputManager, Pointer } from '../../../shared/input/InputManager';
import WhiteTex from "../../../shared/textures/white.png"


import VectorPaintShader from "../shaders/vectorpaint.fs";
import { Blitter } from '../../../shared/blitter/blit';

import DefaultVSBlit from "../../../shared/blitter/shaders/blit.vs";

/**
 * A class to set up some basic scene elements to minimize code in the
 * main execution file.
 */
export default class UVDisplacementScene extends SceneBase{
    
   
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

    heroModel: THREE.Mesh;
    clock:THREE.Clock;

    albedoPaintTexture: PaintableTexture = new PaintableTexture(512,512, {BrushSettings:{brushRadius:{value:0.025}, blendStrength:{value:1}}});
    flowPaintTexture: PaintableTexture = new PaintableTexture(512,512, {BrushSettings:{brushRadius:{value:0.1}, blendStrength:{value:0.1}}, fragmentShader:VectorPaintShader});

    depthPicker: DepthPick;

    input:InputManager;

    fireTexture:THREE.Texture;
    whiteTexture:THREE.Texture;
    albedoPaintCanvasModel:THREE.Mesh;
    flowPaintCanvasModel:THREE.Mesh;

    allowPaintOnHero: boolean = false;

    flowReadTexture: THREE.WebGLRenderTarget;
    flowWriteTexture: THREE.WebGLRenderTarget;

    blitter: Blitter = new Blitter();

    additiveCopyMaterial: THREE.ShaderMaterial;

    initialize(debug: boolean = true, addGridHelper: boolean = true){
        window["scene"] = this;
        this.input = InputManager.Get();
        this.clock = new THREE.Clock(true);
        this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, .1, 100);
        this.camera.position.z = 4;
        this.camera.lookAt(0,0,0);

        this.depthPicker = new DepthPick(this.camera);

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById("app") as HTMLCanvasElement,
            alpha: true
        });
        
        this.renderer.setSize(this.width, this.height);
        UVDisplacementScene.addWindowResizing(this.camera, this.renderer);
        
        // set the background color
        this.background = new THREE.Color(0x000000);
        const geometry = new THREE.PlaneGeometry();

        this.fireTexture = new THREE.TextureLoader().load(FireTex); 
        this.fireTexture.wrapS = THREE.RepeatWrapping;
        this.fireTexture.wrapT = THREE.RepeatWrapping;

        this.whiteTexture = new THREE.TextureLoader().load(WhiteTex);

        this.flowWriteTexture = new THREE.WebGLRenderTarget(512,512);
        this.flowWriteTexture.texture.wrapS = this.flowWriteTexture.texture.wrapT = THREE.RepeatWrapping;

        this.flowReadTexture = new THREE.WebGLRenderTarget(512,512);
        this.flowReadTexture.texture.wrapS = this.flowReadTexture.texture.wrapT = THREE.RepeatWrapping;

        this.renderer.setClearColor(new THREE.Color(0.5,0.5,0.0));
        this.renderer.setRenderTarget(this.flowPaintTexture.RenderTarget);
        this.renderer.clear();
        this.renderer.setRenderTarget(this.flowWriteTexture);
        this.renderer.clear();
        this.renderer.setRenderTarget(this.flowReadTexture);
        this.renderer.clear();
        
        this.renderer.setRenderTarget(null);

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
                mainTex: {value:this.fireTexture},
                //dispTex: {value:this.flowReadTexture.texture},
                dispTex: {value:dispTex},
            },
            vertexShader: FireVertexShader,
            fragmentShader: FireFragmentShader,
            transparent:true
        })

        this.heroModel = new THREE.Mesh(geometry, this.material);
        this.heroModel.position.set(-0.55,0,0);
        this.add(this.heroModel);
        
        this.albedoPaintCanvasModel = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
            map:this.albedoPaintTexture.RenderTarget.texture
        }))

        this.albedoPaintCanvasModel.position.set(0.55,0,0);
        this.add(this.albedoPaintCanvasModel); 
        
        this.flowPaintCanvasModel = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
            //map:this.flowPaintTexture.RenderTarget.texture
            map:this.flowReadTexture.texture
        }));
        this.flowPaintCanvasModel.position.set(1.6,0,0);
        this.add(this.flowPaintCanvasModel);

        this.albedoPaintTexture.Import(this.fireTexture);
        this.albedoPaintTexture.Paint(this.renderer,this.camera,this.heroModel,new THREE.Vector3(0,10000,0));

        //this.flowPaintTexture.Import(dispTex);
        //this.flowPaintTexture.Paint(this.renderer,this.camera,this.heroModel,new THREE.Vector3(0,10000,0));

        this.additiveCopyMaterial = new THREE.ShaderMaterial({
            vertexShader:DefaultVSBlit,
            fragmentShader:
            `
                varying vec2 vUv;
                uniform sampler2D map;
                uniform sampler2D currentState;

                void main()	{
                    vec4 current = texture2D(currentState, vUv);
                    vec2 brushVal = texture2D(map, vUv).xy;
                    brushVal = (brushVal * 2.0) - 1.0;
                    
                    current.xy += brushVal * 0.1;
                    current.a = 1.0;
                    gl_FragColor = current;
                    return;
                }
            `,

            uniforms:{
                currentState:{value:this.flowReadTexture.texture},
                map:{value:null}
            }
        })

        this.initStandaloneGUI();
        this.effectComposer = new EffectComposer(this.renderer);
        
        this.effectComposer.addPass(new RenderPass(this, this.camera));

        this.bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 0.075, 0.1, 0.1 );
        this.effectComposer.addPass(this.bloomPass);

        this.effectComposer.addPass(new OutputPass())
    }
    effectComposer: EffectComposer;
    bloomPass: UnrealBloomPass;
    loadTexture(url:string){
        var loader = new THREE.TextureLoader();
        loader.setCrossOrigin("");
        let fireTex = loader.load(url);
        fireTex.wrapS = THREE.RepeatWrapping;
        fireTex.wrapT = THREE.RepeatWrapping;
        this.albedoPaintTexture.Import(fireTex);
    }

    restoreOriginalFireTexture(){
        this.albedoPaintTexture.Import(this.fireTexture);
        this.albedoPaintTexture.Paint(this.renderer,this.camera,this.heroModel,new THREE.Vector3(0,10000,0));
    }

    setFireTextureToWhite()
    {
        this.albedoPaintTexture.Import(this.whiteTexture);
        this.albedoPaintTexture.Paint(this.renderer,this.camera,this.heroModel,new THREE.Vector3(0,10000,0));
    }

    update(){
        let dt = this.clock.getDelta();
        this.camera.updateProjectionMatrix();

        this.effectComposer.setSize(window.innerWidth, window.innerHeight);
        this.effectComposer.render(dt);
        //this.renderer.render(this, this.camera);
        
        if(this.albedoPaintTexture.dirty){
            this.albedoPaintTexture.Paint(this.renderer,this.camera,this.albedoPaintCanvasModel,new THREE.Vector3(0,10000,0));
        }

        if(this.material){
            this.material.uniforms["Time"]["value"] += 0.016;
            this.material.needsUpdate = true;
        }

        this.input.pointers.forEach((value,key)=>{ 
            if(value.isDown){
                this.Paint(value);
            }
        })       

        this.blitter.blit(this.flowPaintTexture.RenderTarget.texture, this.flowWriteTexture, this.renderer, this.camera, this.additiveCopyMaterial);
        this.blitter.blit(this.flowWriteTexture.texture, this.flowReadTexture, this.renderer, this.camera)

        this.renderer.setClearColor(new THREE.Color(0.5,0.5,0.0));
        this.renderer.setRenderTarget(this.flowWriteTexture);
        this.renderer.clear();

        this.renderer.setClearColor(new THREE.Color(0.5,0.5,0.0));
        this.renderer.setRenderTarget(this.flowPaintTexture.RenderTarget)
        this.renderer.clear();
        
        this.renderer.setRenderTarget(null);
        
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

        if(this.allowPaintOnHero){
            this.albedoPaintTexture.Paint(this.renderer,this.camera,this.heroModel,pos)
        }
        
        {
            this.albedoPaintTexture.Paint(this.renderer,this.camera, this.albedoPaintCanvasModel, pos);
            this.flowPaintTexture.Paint(this.renderer,this.camera,this.flowPaintCanvasModel,pos)
        }
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
        this.gui =  new GUI();

        const materialSettingsGroup = this.gui.addFolder("Material Properties");
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

        let brushColor = this.gui.addColor(this.albedoPaintTexture,'brushColor');
        brushColor.onChange(()=>{
            this.albedoPaintTexture.SetColor(this.albedoPaintTexture.brushColor);
        });

        this.gui.add(this,"allowPaintOnHero").name("Paint on both");
        this.gui.add(this, "setFireTextureToWhite");
    }
}