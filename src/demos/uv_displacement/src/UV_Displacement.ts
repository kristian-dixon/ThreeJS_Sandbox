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
export enum PaintMode{
    None,
    Albedo,
    Flow
}
/**
 * A class to set up some basic scene elements to minimize code in the
 * main execution file.
 */
export default class UVDisplacementScene extends SceneBase{

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
    paintCanvas:THREE.Mesh;
    

    allowPaintOnHero: boolean = false;

    flowReadTexture: THREE.WebGLRenderTarget;
    flowWriteTexture: THREE.WebGLRenderTarget;

    blitter: Blitter = new Blitter();

    additiveCopyMaterial: THREE.ShaderMaterial;
    dispTex: THREE.Texture;

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
        //this.background = new THREE.Color(0x00000000);
        this.renderer.setClearColor(new THREE.Color(0,0,0));
        const geometry = new THREE.PlaneGeometry();

        this.fireTexture = new THREE.TextureLoader().load(FireTex); 
        this.fireTexture.wrapS = THREE.RepeatWrapping;
        this.fireTexture.wrapT = THREE.RepeatWrapping;

        this.whiteTexture = new THREE.TextureLoader().load(WhiteTex);

        this.flowWriteTexture = new THREE.WebGLRenderTarget(512,512);
        this.flowWriteTexture.texture.wrapS = this.flowWriteTexture.texture.wrapT = THREE.MirroredRepeatWrapping;

        this.flowReadTexture = new THREE.WebGLRenderTarget(512,512);
        this.flowReadTexture.texture.wrapS = this.flowReadTexture.texture.wrapT = THREE.MirroredRepeatWrapping;

        this.renderer.setClearColor(new THREE.Color(0.5,0.5,0.0));
        this.renderer.setRenderTarget(this.flowPaintTexture.RenderTarget);
        this.renderer.clear();
        this.renderer.setRenderTarget(this.flowWriteTexture);
        this.renderer.clear();
        this.renderer.setRenderTarget(this.flowReadTexture);
        this.renderer.clear();
        
        this.renderer.setRenderTarget(null);

        this.dispTex = new THREE.TextureLoader().load(FlowTex);
        this.dispTex.wrapS = THREE.RepeatWrapping;
        this.dispTex.wrapT = THREE.RepeatWrapping;

        this.material = new THREE.ShaderMaterial({
            uniforms:{
                Time: {value:0.0},
                displacementStr:{value:0.3},
                verticalStrength:{value:3.6},
                scrollSpeed:{value: new THREE.Vector2(0.4, -1)},
                displacementUVScale:{value: new THREE.Vector2(5, 2.6)},
                mainTex: {value:this.fireTexture},               
                dispTex: {value:this.dispTex},
            },
            vertexShader: FireVertexShader,
            fragmentShader: FireFragmentShader,
            transparent:true,
            depthWrite:true
        })

        this.heroModel = new THREE.Mesh(geometry, this.material);
        this.heroModel.position.set(-0.55,0,0);
        //this.add(this.heroModel);
        
        this.paintCanvas = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
            map:this.albedoPaintTexture.RenderTarget.texture
        }))

        this.paintCanvas.position.set(0.525,0,0);
        this.add(this.paintCanvas); 
        
       
        this.albedoPaintTexture.Import(this.fireTexture);
        this.albedoPaintTexture.Paint(this.renderer,this.camera,this.heroModel,new THREE.Vector3(0,10000,0));

        
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
                    
                    current.xy += -brushVal * 0.15;
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

        let heroScene = new THREE.Scene();
        heroScene.add(this.heroModel);

        this.initStandaloneGUI();
        this.effectComposer = new EffectComposer(this.renderer);
        
        let renderPass = new RenderPass(heroScene, this.camera);
        this.effectComposer.addPass(renderPass);

        let renderPass2 = new RenderPass(this, this.camera);
        renderPass2.clear = false;
        
        this.bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 0.075, 0.1, 0.1 );
        
        this.effectComposer.addPass(this.bloomPass);
        this.effectComposer.addPass(renderPass2);

        this.effectComposer.addPass(new OutputPass())

        this.changePage(0);
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

        this.renderer.setClearColor(new THREE.Color(0.0,0.0,0.0));

        if(window.self != window.top)
            this.renderer.setClearAlpha(0);

        this.effectComposer.setSize(window.innerWidth, window.innerHeight);
        this.effectComposer.render(dt);

        if(this.material){
            this.material.uniforms["Time"]["value"] += 0.016;
            this.material.needsUpdate = true;
        }

        if(this.albedoPaintTexture.dirty){
            this.albedoPaintTexture.Paint(this.renderer,this.camera,this.paintCanvas,new THREE.Vector3(0,10000,0));
        }

        if(this.flowPaintTexture.dirty){
            this.flowPaintTexture.Paint(this.renderer,this.camera,this.paintCanvas,new THREE.Vector3(0,10000,0));
        }


        if(this.activePainter == null){
            return;
        }

        this.input.pointers.forEach((value,key)=>{ 
            if(value.isDown){
                this.Paint(value);
            }
        })       

        if(this.currentPaintMode == PaintMode.Flow)
        {
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
    }

    Paint(pointerInfo:Pointer){
        //let pos = this.scenePicker(this, this.camera, cursorPostion);
        if (!pointerInfo) {
            return;
        }

        let depth = this.depthPicker.pick(pointerInfo.cssPosition, this.paintCanvas, this.renderer, this.camera);

        console.log(depth);

        if(depth >= 1)
        {
            depth = this.depthPicker.pick(pointerInfo.cssPosition, this.heroModel, this.renderer, this.camera);
            if(depth >= 1){
                //Probably casting against the skybox
                return;
            }
            
        }

        let remappedDepth = (depth*2)-1.0;
        let pos = new THREE.Vector3(pointerInfo.position.x, pointerInfo.position.y,remappedDepth).unproject(this.camera);

        let velocity = null;
        if(pointerInfo.wsPosition){
            velocity = pos.clone().sub(pointerInfo.wsPosition);
        }
        
        if(this.allowPaintOnHero){
            this.activePainter.Paint(this.renderer,this.camera,this.heroModel,pos, velocity)
        }
        
        this.activePainter.Paint(this.renderer,this.camera, this.paintCanvas, pos, velocity);

        pointerInfo.wsPosition = pos.clone();
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
        if(window.self != window.top) return;
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

    



    
    recieveMessage(call: string, args: any) {
        this[call](args);
    }


    changePage(targetPage: number)
    {
        if(targetPage == 0 || targetPage == 1)
        {
            //Focus on hero object, hide other objects
            this.heroModel.position.set(0,-0.25,0);
            this.heroModel.scale.set(2,2,2);

            this.visible = false;
        }
        else if(targetPage == 2)
        {
            this.heroModel.position.set(-0.525,0,0);
            this.heroModel.scale.set(1.0,1.0,1.0);

            this.material.uniforms.scrollSpeed.value = new THREE.Vector2(0,0);
            this.material.uniforms.displacementUVScale.value = new THREE.Vector2(1,1);
            this.material.uniforms.displacementStr.value = 0.1;
            this.material.uniforms.verticalStrength.value = 0;
            this.visible = true;

            
            this.setPaintMode("Flow");
            this.setRenderDrawnFlowmap(true);
        }        

        if(targetPage == 1){
            this.page1MaterialSetup();
        }
    }

    useDrawnFire = false;
    useDrawnFlowmap = false;

    resetMaterials()
    {
        let uniforms = this.material.uniforms;
        
        uniforms.Time = {value:0.0};
        uniforms.displacementStr = {value:0.3};
        uniforms.verticalStrength = {value:3.6};
        uniforms.scrollSpeed = {value: new THREE.Vector2(0.4, -1)},
        uniforms.displacementUVScale={value: new THREE.Vector2(5, 2.6)};
        uniforms.mainTex = {value:this.useDrawnFire? this.albedoPaintTexture.RenderTarget.texture : this.fireTexture};               
        uniforms.dispTex = {value:this.useDrawnFlowmap? this.flowPaintTexture.RenderTarget.texture : this.dispTex};
    }

    page1MaterialSetup()
    {
        let uniforms = this.material.uniforms;
        
        uniforms.Time = {value:0.0};
        uniforms.displacementStr = {value:0.0};
        uniforms.verticalStrength = {value:0};
        uniforms.scrollSpeed = {value: new THREE.Vector2(0, 0)},
        uniforms.displacementUVScale={value: new THREE.Vector2(1, 1)};
        uniforms.mainTex = {value:this.useDrawnFire? this.albedoPaintTexture.RenderTarget.texture : this.fireTexture};               
        uniforms.dispTex = {value:this.useDrawnFlowmap? this.flowPaintTexture.RenderTarget.texture : this.dispTex};
    }

    

    setRenderDrawnAlbedo(val:boolean){
        this.useDrawnFire = val;
        this.material.uniforms.mainTex = {value:this.useDrawnFire? this.albedoPaintTexture.RenderTarget.texture : this.fireTexture};    
    }
    
    setRenderDrawnFlowmap(val:boolean)
    {
        this.useDrawnFlowmap = val;
        this.material.uniforms.dispTex = {value:this.useDrawnFlowmap? this.flowReadTexture.texture : this.dispTex};
    }

    setDisplacementStrength(val:number){
        this.material.uniforms.displacementStr.value = val;
    }

    setUVScaleX(val:number){
        this.material.uniforms.displacementUVScale.value.x = val;
    }

    setUVScaleY(val:number){
        this.material.uniforms.displacementUVScale.value.y = val;
    }

    setUVScrollSpeedX(val:number){
        this.material.uniforms.scrollSpeed.value.x = val;
    }

    setUVScrollSpeedY(val:number)
    {
        this.material.uniforms.scrollSpeed.value.y = val;
    }

    setRenderGradient(val:boolean){
        this.material.defines.OUTPUT_GRADIENT = val;
    }

    setGradientStrength(val:number){
        this.material.uniforms.verticalStrength.value = val;
    }

    setBrushColour(colour:string){
        this.albedoPaintTexture.SetColor(colour);
    }

    currentPaintMode = PaintMode.None;
    activePainter: PaintableTexture = null;

    setPaintMode(mode:string){
        let targetMode = PaintMode[mode];
        switch(targetMode)
        {
            case PaintMode.None:
                this.activePainter = null;
                break;
            case PaintMode.Albedo:
                this.activePainter = this.albedoPaintTexture;
                (this.paintCanvas.material as THREE.MeshBasicMaterial).map = this.albedoPaintTexture.RenderTarget.texture;
                break;
            case PaintMode.Flow:
                this.activePainter = this.flowPaintTexture;
                (this.paintCanvas.material as THREE.MeshBasicMaterial).map = this.flowReadTexture.texture;
                break;
        }
        this.currentPaintMode = targetMode;
    }   

    exportFlowmap()
    {
        this.flowPaintTexture.Export(this.renderer);
    }

    importFlowmap(url:string){
        var loader = new THREE.TextureLoader();
        loader.setCrossOrigin("");
        let fireTex = loader.load(url);
        fireTex.wrapS = THREE.RepeatWrapping;
        fireTex.wrapT = THREE.RepeatWrapping;
        this.flowPaintTexture.Import(fireTex);
    }
}