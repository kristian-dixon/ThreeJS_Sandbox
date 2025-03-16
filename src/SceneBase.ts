import * as THREE from 'three';
import {ARButton} from 'three/examples/jsm/webxr/ARButton.js';
import {VRButton} from 'three/examples/jsm/webxr/VRButton.js';

export default abstract class DemoBase
{
    //mainScene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    events:THREE.EventDispatcher;
    constructor(){
        //this.mainScene = new THREE.Scene();
        this.events = new THREE.EventDispatcher();
        this.renderer = new THREE.WebGLRenderer();

        let arButton = ARButton.createButton(this.renderer, {offerSession:true});
        let vrButton = VRButton.createButton(this.renderer);

        this.events.addEventListener("AR_REQUESTED", ()=>{
            arButton.click();
        })

        this.events.addEventListener("VR_REQUESTED", ()=>{
            vrButton.click();
        })
    }

    abstract initialize(options?:any);
    abstract update(options?:any);

    recieveMessage(call: string, args: any) {
        this.events.dispatchEvent({type:call, message:args});
    }
}