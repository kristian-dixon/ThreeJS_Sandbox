import { GUI } from 'dat.gui';
import * as THREE from 'three';
import {ARButton} from 'three/examples/jsm/webxr/ARButton.js';
import {VRButton} from 'three/examples/jsm/webxr/VRButton.js';

export default abstract class DemoBase
{
    renderer: THREE.WebGLRenderer;
    events:THREE.EventDispatcher;
    gui: GUI = null;

    private timeManager: THREE.Clock;
    private dt: number=0;

    constructor(){
        this.events = new THREE.EventDispatcher();
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById("app") as HTMLCanvasElement,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.xr.enabled = true;

        this.timeManager = new THREE.Clock();

        let arButton = ARButton.createButton(this.renderer, {offerSession:true});
        let vrButton = VRButton.createButton(this.renderer);
        
        this.events.addEventListener("AR_REQUESTED", ()=>{
            if(arButton.textContent != "START AR")
            {
                alert("AR session cannot be started. Please ensure your device supports rendering WebXR AR content and that the page has permission to use WebXR.");
            }

            arButton.click();
        })

        this.events.addEventListener("VR_REQUESTED", ()=>{
            if(vrButton.textContent != "START VR")
            {
                alert("VR session cannot be started. Please ensure your device supports rendering WebXR VR content and that the page has permission to use WebXR.");
            }

            vrButton.click();
        })


        this.gui = new GUI();
        let xrFolder = this.gui.addFolder('XR');
        xrFolder.add(arButton, 'click').name("Start AR");
        xrFolder.add(vrButton, 'click').name("Start VR");
        if(window.self != window.top)
        {
            this.gui.hide();
        }

        let self = this;
        window.addEventListener( 'resize', onWindowResize,false );
        function onWindowResize(){
            self.renderer.setSize( window.innerWidth, window.innerHeight );
        }
    }

    abstract initialize(options?:any);
    
    update(options?:any)
    {
        this.dt = this.timeManager.getDelta();
    }

    recieveMessage(call: string, args: any) {
        this.events.dispatchEvent({type:call, message:args});
    }

    getDeltaTime():number{
        return this.dt;
    }
}