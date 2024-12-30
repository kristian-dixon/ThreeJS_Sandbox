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
        // window.addEventListener('mousemove', this.OnMouseMoved.bind(this));
        // window.addEventListener('mouseout', this.OnMouseLost.bind(this));
        // window.addEventListener('mouseleave', this.OnMouseLost.bind(this));
        // window.addEventListener('mousedown', this.OnMouseDown.bind(this));
        // window.addEventListener('mouseup',this.OnMouseUp.bind(this));

        // window.addEventListener("pointerdown", handleStart, false);

        window.addEventListener('contextmenu', (e)=>{e.preventDefault();})
    }

    private OnPointerDown(event:PointerEvent)
    {

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
        this.touches[touch.identifier].position = ClientSpaceToNormalizedSpace(touch.clientX,touch.clientY);
    }
    
}



export class InputManager{
    private static instance: InputManager;
    //mouse:Mouse=new Mouse();
    //touchManager:Touches=new Touches();

    pointers = new Map<number,Pointer>();

    public static Get(){
        if(InputManager.instance == null)
        {
            InputManager.instance = new InputManager();
        }

        return InputManager.instance;
    }

    private constructor(){   

        if(window.self != window.top)
        {
            //return;
        }

        let canvas = document.getElementById('app');
        console.log(canvas);
        canvas.addEventListener('contextmenu', (e)=>{e.preventDefault();})

        canvas.addEventListener('pointerdown', this.OnPointerDown.bind(this))
        canvas.addEventListener('pointerup', this.OnPointerUp.bind(this))

        canvas.addEventListener('pointermove', this.OnPointerMove.bind(this));
        canvas.addEventListener('pointercancel', this.OnDestroyPointer.bind(this))
    }

    public ExternalInputEvent(key: string, event:PointerEvent){
        //'event:pointermove'
        let eventName = key.substring(6);
        console.log('event name: ', eventName);
        switch(eventName){
            case 'pointerdown':
                this.OnPointerDown(event);
            break;
            case 'pointerup':
                this.OnPointerUp(event);
            break;
            case 'pointermove':
                this.OnPointerMove(event);
            break;
            case 'pointercancel':
                this.OnDestroyPointer(event);
            break;
        }

    }

    private OnPointerDown(event:PointerEvent){
        let pointer = this.pointers.get(event.pointerId)

        if(!pointer)
        {
            pointer = new Pointer(new THREE.Vector2(event.clientX, event.clientY), ClientSpaceToNormalizedSpace(event.clientX,event.clientY)); 
            this.pointers.set(event.pointerId,pointer);
        }

        pointer.isDown = true;
        this.pointers.set(event.pointerId, pointer);
    }

    private OnPointerUp(event:PointerEvent)
    {
        let pointer = this.pointers.get(event.pointerId);
        if(pointer){
            pointer.isDown = false;
        }
    }

    private OnPointerMove(event:PointerEvent){
        let pointer = this.pointers.get(event.pointerId)

        if(!pointer)
        {
            pointer = new Pointer(new THREE.Vector2(event.clientX, event.clientY), ClientSpaceToNormalizedSpace(event.clientX,event.clientY)); 
            this.pointers.set(event.pointerId,pointer);
        }

        pointer.cssPosition = new THREE.Vector2(event.clientX, event.clientY);
        pointer.position = ClientSpaceToNormalizedSpace(event.clientX, event.clientY);
        this.pointers.set(event.pointerId, pointer);
    }

    private OnDestroyPointer(event:PointerEvent){
        this.pointers.delete(event.pointerId);
    }
}

export class Pointer{
    cssPosition: THREE.Vector2 = new THREE.Vector2(0,0);
    wsPosition: THREE.Vector3 = null;
    position: THREE.Vector2 = new THREE.Vector2(0,0);
    isDown = false;
    constructor(cssPos: THREE.Vector2, pos:THREE.Vector2)
    {
        this.cssPosition =cssPos;
        this.position=pos;
    }
}