import * as THREE from 'three';

export function ClientSpaceToNormalizedSpace(clientX:number, clientY:number):THREE.Vector2{
    return new THREE.Vector2(
        (clientX / window.innerWidth) * 2.0 - 1,
        (clientY / window.innerHeight) * -2.0 + 1
    );
}

export class Mouse {
    position = new THREE.Vector2(-1000,-1000);
    buttons : boolean[] = [];

    constructor(){
        window.addEventListener('mousemove', this.OnMouseMoved.bind(this));
        window.addEventListener('mouseout', this.OnMouseLost.bind(this));
        window.addEventListener('mouseleave', this.OnMouseLost.bind(this));
        window.addEventListener('mousedown', this.OnMouseDown.bind(this));
        window.addEventListener('mouseup',this.OnMouseUp.bind(this));
    }

    private OnMouseMoved(event:MouseEvent)
    {
        this.position = ClientSpaceToNormalizedSpace(event.clientX, event.clientY);
    }

    private OnMouseLost(event:MouseEvent)
    {
        this.position.x = -100000;
        this.position.y = -100000;
    }

    private OnMouseDown(event: MouseEvent){
        console.log(event);
        this.buttons[event.button] = true;
    }

    private OnMouseUp(event: MouseEvent){
        this.buttons[event.button] = false;
    }
}

export class Touch{
    public position = new THREE.Vector2(-1000,-1000);
    public isHeld = false;
}

export class Touches{
    touches:Touch[] = [];

    constructor()
    {
        window.addEventListener('touchstart', this.OnTouchStart.bind(this), {passive:false})
        window.addEventListener('touchmove', this.OnTouchChanged.bind(this))
        window.addEventListener('touchend', this.OnTouchEnd.bind(this))       
    }

    private OnTouchStart(event:TouchEvent)
    {
        event.preventDefault();

        for(let i = 0; i < event.changedTouches.length; i++){
            this.UpdateTouch(event.changedTouches[i]);
        }
    }

    private OnTouchChanged(event:TouchEvent){
        for(let i = 0; i < event.changedTouches.length; i++){
            this.UpdateTouch(event.changedTouches[i]);
        }
    }

    private OnTouchEnd(event:TouchEvent){
        for(let i = 0; i < event.changedTouches.length; i++){
            this.touches[event.changedTouches[i].identifier]!.isHeld = false;
        }
    }

    private UpdateTouch(touch:globalThis.Touch){
        if(!this.touches[touch.identifier]){
            this.touches[touch.identifier] = new Touch();
        }
        
        this.touches[touch.identifier].isHeld = true;
       // if(touch.force > 0){
            this.touches[touch.identifier].position = ClientSpaceToNormalizedSpace(touch.clientX,touch.clientY);
       // }
        // else{
        //     this.touches[touch.identifier].position = new THREE.Vector2(-10000,-10000);
        // }
    }
    
}

export class InputManager{
    private static instance: InputManager;
    mouse:Mouse=new Mouse();
    touchManager:Touches=new Touches();

    public static Get(){
        if(InputManager.instance == null)
        {
            InputManager.instance = new InputManager();
        }

        return InputManager.instance;
    }

    private constructor(){   

    }
}