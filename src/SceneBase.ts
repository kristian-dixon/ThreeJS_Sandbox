import { GUI } from 'dat.gui';
import * as THREE from 'three';
import {ARButton} from 'three/examples/jsm/webxr/ARButton.js';
import {VRButton} from 'three/examples/jsm/webxr/VRButton.js';

export enum XRState
{
    NONE = "NONE",
    PendingAR = "PendingAR",
    PendingVR = "PendingVR",
    RunningAR = "RunningAR",
    RunningVR = "RunningVR",
    ExitAR = "ExitAR",
    ExitVR = "ExitVR"
}

export default abstract class DemoBase
{
    renderer: THREE.WebGLRenderer;
    events:THREE.EventDispatcher;
    gui: GUI = null;

    private timeManager: THREE.Clock;
    private dt: number=0;

    private xrState = XRState.NONE;

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
                alert("AR session cannot be started. \nPlease ensure your device supports rendering WebXR AR content and that the page has permission to use WebXR.");
                return;
            }

            this.SetXRState(XRState.PendingAR);
            arButton.click();
        })

        this.events.addEventListener("VR_REQUESTED", ()=>{
            if(vrButton.textContent != "ENTER VR")
            {
                alert("VR session cannot be started. \nPlease ensure your device supports rendering WebXR VR content and that the page has permission to use WebXR.");
                return;
            }

            this.SetXRState(XRState.PendingVR);
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

        window["DemoApp"] = this;
    }

    abstract initialize(options?:any);
    
    update(options?:any)
    {
        this.dt = this.timeManager.getDelta();

        //XR State management
        if(this.renderer.xr.isPresenting)
        {
            if(this.xrState === XRState.PendingAR)
            {
                this.SetXRState(XRState.RunningAR);
            }

            if(this.xrState === XRState.PendingVR || this.xrState == XRState.NONE)
            {
                this.SetXRState(XRState.RunningVR);
            }
        }
        else if(this.xrState == XRState.RunningAR)
        {
            this.SetXRState(XRState.ExitAR);
        }
        else if(this.xrState == XRState.RunningVR)
        {
            this.SetXRState(XRState.ExitVR);
        }
        
    }

    recieveMessage(call: string, args: any) {
        this.events.dispatchEvent({type:call, message:args});
    }

    getDeltaTime():number{
        return this.dt;
    }

    private SetXRState(state:XRState)
    {
        if(this.xrState === state)
            return;

        let previousState = this.xrState;
        this.xrState = state;

        this.events.dispatchEvent({type:"XR_StateChanged", message:{previousState:previousState, targetState:state}})
    }
}