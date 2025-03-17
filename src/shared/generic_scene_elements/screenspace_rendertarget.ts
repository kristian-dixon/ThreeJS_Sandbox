import { EventDispatcher, Vector2, WebGLRenderTarget, WebGLRenderTargetOptions } from "three";

//A class for managing render targets that are intended to be used in screenspace
export class ScreenspaceRenderTarget
{
    renderTarget: WebGLRenderTarget;
    scaleFactor: Vector2;
    private dispatcher: EventDispatcher;

    constructor(scaleFactor:Vector2, options?: WebGLRenderTargetOptions)
    {
        this.renderTarget = new WebGLRenderTarget(window.innerWidth * scaleFactor.x, window.innerHeight * scaleFactor.y);
        this.scaleFactor = scaleFactor;
        this.dispatcher = new EventDispatcher();

        window.addEventListener('resize', ()=>{
            this.renderTarget.dispose();
            this.renderTarget = new WebGLRenderTarget(window.innerWidth * scaleFactor.x, window.innerHeight * scaleFactor.y);
            this.dispatcher.dispatchEvent({type:"RenderTargetRebuilt"})
        })
    }

    subscribeToRefresh(onEvent:any)
    {
        if(this.dispatcher.hasEventListener("RenderTargetRebuilt", onEvent))
        {
            return;
        }
        this.dispatcher.addEventListener("RenderTargetRebuilt", onEvent);
    }

    unsubscribeFromRefresh(onEvent:any)
    {
        if(!this.dispatcher.hasEventListener("RenderTargetRebuilt", onEvent))
        {
            return;
        }
        this.dispatcher.removeEventListener("RenderTargetRebuilt", onEvent);
    }

    public get texture(){
        return this.renderTarget.texture;
    }

    public get depthTexture(){
        return this.renderTarget.depthTexture;
    }
}