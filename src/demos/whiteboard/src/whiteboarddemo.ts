import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"

import FoldoutShaderVert from "../shaders/planet_foldout/vertex.vs"
import FoldoutShaderFrag from "../shaders/planet_foldout/frag.fs"

import GradientTexturePath from "../textures/SeaLandAirGradient.png";

import SceneBase from '../../../SceneBase';
import { InputManager, Pointer } from '../../../shared/input/InputManager';

import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

import { PaintableTexture } from '../../../shared/meshpainting/scripts/PaintableSurface';
import { DepthPick } from '../../../shared/picking/depthpick';
import GlbTest from "../models/CesiumMilkTruck.glb"

export default class WhiteboardDemoScene extends SceneBase {
    camera: THREE.PerspectiveCamera = null;
    renderer: THREE.WebGLRenderer = null;

    // Get some basic params
    width = window.innerWidth;
    height = window.innerHeight;

    currentPage = 0;

    raycaster: THREE.Raycaster;

    input:InputManager;
    rootNode: THREE.Object3D;
    clock:THREE.Clock;

    paintPreviewMaterial: THREE.Material;

    animationMixer: THREE.AnimationMixer;

    paintableTexture:PaintableTexture = new PaintableTexture(512,512);

    gltfLoader = new GLTFLoader();
    gltf: THREE.Group;

    depthTest:DepthPick;

    
    initialize(debug: boolean = true, addGridHelper: boolean = true) {
        this.clock = new THREE.Clock(true);
        this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 1, 20);
        this.camera.position.z = 8;
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById("app") as HTMLCanvasElement,
            alpha: true, 
            antialias: true
           // preserveDrawingBuffer:true -- this is for the canvas
        });

        this.renderer.setSize(this.width, this.height);
        this.setupScene();

        this.input=InputManager.Get();
        this.raycaster = new THREE.Raycaster();
        WhiteboardDemoScene.addWindowResizing(this.camera, this.renderer, this.paintPreviewMaterial);
        window["scene"] = this;

        this.initStandaloneUI();

        this.depthTest = new DepthPick(this.camera);
    }

    pointerPosition: THREE.Vec2 = new THREE.Vector2(-1000,-1000);
    gui:GUI;
    private initStandaloneUI()
    {
        if(window.self != window.top){
            //return;
        }
        this.gui = new GUI(
            {
                //closed:true,
                closeOnTop:true
            }

        );

        //this.gui.close();

        this.gui.add(this.pointerPosition, "x").name("PointerPosition x");
        this.gui.add(this.pointerPosition, "y").name("PointerPosition y");

        let brushSettings = this.gui.addFolder("Brush Settings");
        let brushColor = brushSettings.addColor(this.paintableTexture,'brushColor');
        brushColor.onChange(()=>{
            this.paintableTexture.SetColor(this.paintableTexture.brushColor);
        });
        brushColor.setValue(0xff0000)
        brushColor.name("Colour");

        brushSettings.add(this.paintableTexture.Settings.blendStrength,'value').name("Blend Strength");
        brushSettings.add(this.paintableTexture.Settings.brushRadius,'value').name("Brush Radius");


        let cameraSettings = this.gui.addFolder("Camera Settings");
        cameraSettings.add(this, "cameraOrbitEnabled").name("Orbit Camera");
        cameraSettings.add(this.camera.rotation, "x", -3.14, 3.14, 0.01);
        cameraSettings.add(this.camera.rotation, "y", -3.14, 3.14, 0.01);


        this.gui.add(this.paintPreviewMaterial, "visible").name("Toggle Paint Preview");

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
        
            this.loadTexture(userImageURL);
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
        this.gui.add(buttonsFuncs, "textureExporter").name("Save Texture");
        this.gui.add(buttonsFuncs, "textureImporter").name("Load Texture");
        this.gui.add(buttonsFuncs, "modelLoader").name("Load Model");

    }



    private setupScene() {
        const light = new THREE.DirectionalLight(0xffffff, 5);
        light.position.set(4, 10, 10);
        this.add(light);
        this.add(new THREE.HemisphereLight(0xffffff, 0xfdaa91, 2.0));

        if(window.self == window.top){
            this.background = new THREE.Color(0x9f88);
        }
        
        this.rootNode = new THREE.Object3D();
        this.add(this.rootNode);

        let self = this;
        this.loadModel(GlbTest);

        let gradientTex = new THREE.TextureLoader().load(GradientTexturePath);
        this.paintPreviewMaterial = new THREE.ShaderMaterial({
            uniforms:{
                uTime:{value:0.9999},
                uGradient:{value:gradientTex},
                uMap:{value:this.paintableTexture.RenderTarget.texture},
                uRatio:{value:this.camera.aspect}
            },
            vertexShader:FoldoutShaderVert,
            fragmentShader:FoldoutShaderFrag,
            defines:{
                OUTPUT_HEIGHTMAP: false,
                OUTPUT_BRUSHPOSITION: false,
                OUTPUT_RAW_TEXTURE: true,
                FIX_ASPECT:true
            },
            side: THREE.DoubleSide
        });
        this.paintPreviewMaterial.visible = false;

        this.foldoutMaterial =  new THREE.ShaderMaterial({
            uniforms:{
                uTime:{value:0},
                uGradient:{value:gradientTex},
                uMap:{value:this.paintableTexture.RenderTarget.texture},
                uRatio:{value:this.camera.aspect}
            },
            vertexShader:FoldoutShaderVert,
            fragmentShader:FoldoutShaderFrag,
            defines:{
                OUTPUT_HEIGHTMAP: false,
                OUTPUT_BRUSHPOSITION: false,
                OUTPUT_RAW_TEXTURE: true,
                FOLDOUT_EFFECT: true
            },
            side: THREE.DoubleSide
        });

        this.add(new THREE.Mesh(new THREE.PlaneGeometry(), this.paintPreviewMaterial));
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
            
            let textureSet = false;

            gltf.scene.traverse(child=>{
                if(child instanceof THREE.Mesh)
                {
                    if(child.material as THREE.Material){
                        if(child.material["map"] as THREE.Texture && textureSet == false){
                            self.paintableTexture.Import(self.renderer, self.camera, child.material["map"]);
                            textureSet = true;
                        }

                        child.material["map"] = self.paintableTexture.RenderTarget.texture;
                        if(child.material["metalness"] == 1)
                        {
                            child.material["metalness"] = 0;
                        }
                    }
                    else
                    {
                        for(let i = 0; i < child.material.length; i++)
                        {
                            if(child.material[i]["map"] as THREE.Texture && textureSet == false){
                                textureSet = true;
                                self.paintableTexture.Import(self.renderer, self.camera, child.material[i]["map"]);
                            }

                            child.material[i]["map"] = self.paintableTexture.RenderTarget.texture
                            if(child.material["metalness"] == 1)
                            {
                                child.material["metalness"] = 0;
                            }
                        }
                    }
                }
            })

            gltf.scene.scale.set(scale,scale,scale);
            self.rootNode.add(gltf.scene);
            self.gltf = gltf.scene;
            
            if(gltf.animations.length > 0){
                self.animationMixer = new THREE.AnimationMixer(gltf.scene);
                //self.animationMixer.clipAction(gltf.animations[0]).play();
            }

            self.setupFoldoutEffect();
        })
    }

    foldoutRoot: THREE.Group;
    foldoutMaterial: THREE.Material;
    foldoutDirection: number = 1.0;
    setupFoldoutEffect()
    {
        let visibility = false;
        //TODO Cleanup old
        if(this.foldoutRoot){
            visibility = this.foldoutRoot.visible;
            this.rootNode.remove(this.foldoutRoot);
        }

        this.foldoutRoot = this.gltf.clone(true);
        this.foldoutRoot.visible = visibility;

        this.rootNode.add(this.foldoutRoot);
        let self = this;
        this.foldoutRoot.traverse(child=>{
            if(child instanceof THREE.Mesh)
            {
                if(child.material as THREE.Material){

                    child.material = self.foldoutMaterial ;
                }
                else
                {
                    for(let i = 0; i < child.material.length; i++)
                    {
                        child.material[i] = self.foldoutMaterial;
                    }
                }
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

    unfoldModel(){
        this.gltf.visible = false;
        this.foldoutRoot.visible = true;
        this.foldoutMaterial["uniforms"].uTime.value = 0;
        this.foldoutDirection = 1.0;      
    }

    foldModel(){
        this.foldoutMaterial["uniforms"].uTime.value = 1; 
        this.foldoutDirection = -1.0;  
        setTimeout(()=>{
            if(this.foldoutDirection == 1.0){return;}
            this.gltf.visible = true;
            this.foldoutRoot.visible = false;
        }, 1000)
    }

    setUnfolded(val:boolean){
        if(val){
            this.unfoldModel()
        }
        else{
            this.foldModel();
        }
    }

    export(){
        this.paintableTexture.Export(this.renderer);
    }

    loadTexture(uri:string){
        var loader = new THREE.TextureLoader();
        loader.setCrossOrigin("");
        let tex = loader.load(uri); 
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        this.paintableTexture.Import(this.renderer,this.camera,tex);
    }

    cameraOrbitEnabled = true;
    setCameraOrbit(cameraOrbitEnabled){
        this.cameraOrbitEnabled = cameraOrbitEnabled;
    }

    setTexturePreviewVisibility(isVisible:boolean){
        this.paintPreviewMaterial.visible = isVisible;
    }

    setBrushColour(colour:string){
        this.paintableTexture.SetColor(colour);
    }

    setBrushRadius(radius:number){
        this.paintableTexture.SetBrushRadius(radius);
    }

    setCameraPitch(pitch:number){
        this.camera.rotation.setFromVector3(new THREE.Vector3(pitch,this.camera.rotation.y,0));
    }

    setCameraYaw(yaw:number){
        this.camera.rotation.setFromVector3(new THREE.Vector3(this.camera.rotation.x, yaw,0));
    }

    update() {
        let dt = this.clock.getDelta();
        this.camera.position.set(0,0,0);
        if(this.cameraOrbitEnabled){
            this.camera.rotateY(0.6 * dt);
        }
        this.camera.translateZ(8);
        this.camera.updateProjectionMatrix();

        this.input.pointers.forEach((value,key)=>{
            this.pointerPosition.x = value.cssPosition.x;
            this.pointerPosition.y = value.cssPosition.y;
            this.gui.updateDisplay();
        
            if(value.isDown){
                this.Paint(value);
            }
        }) 

        if(this.paintableTexture.dirty){
            this.paintableTexture.Paint(this.renderer,this.camera,this.rootNode,new THREE.Vector3(0,10000,0));
        }

        this.renderer.render(this, this.camera);
        if(this.paintPreviewMaterial)
        {
            this.paintPreviewMaterial["uniforms"].uTime.value += dt;
            this.paintPreviewMaterial.needsUpdate = true;
        }

        if(this.foldoutMaterial){
            this.foldoutMaterial["uniforms"].uTime.value += dt * this.foldoutDirection;
            this.foldoutMaterial.needsUpdate = true;
        }

        if(this.animationMixer)
        {
            this.animationMixer.update(dt);
        }

    }
 
    Paint(pointerInfo:Pointer){
        //let pos = this.scenePicker(this, this.camera, cursorPostion);
        if (!pointerInfo) {
            return;
        }

        let depth = this.depthTest.pick(pointerInfo.cssPosition, this, this.renderer, this.camera);
        if(depth >= (this.camera.far - (this.camera.far * 0.001)))
        {
            //Probably casting against the skybox
            return;
        }

        let remappedDepth = (depth*2)-1.0;
        let pos = new THREE.Vector3(pointerInfo.position.x, pointerInfo.position.y,remappedDepth).unproject(this.camera);
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
        if(call.startsWith('event:')){
            this.input.ExternalInputEvent(call, args);
            return;
        }


        this[call](args);
    }

    

    /**
     * Given a ThreeJS camera and renderer, resizes the scene if the
     * browser window is resized.
     * @param camera - a ThreeJS PerspectiveCamera object.
     * @param renderer - a subclass of a ThreeJS Renderer object.
     */
    static addWindowResizing(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, foldoutMaterial: THREE.Material) {
        window.addEventListener('resize', onWindowResize, false);
        function onWindowResize() {
            // uses the global window widths and height
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);

            foldoutMaterial["uniforms"].uRatio.value = camera.aspect;
        }
    }
}