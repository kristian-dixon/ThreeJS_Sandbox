import * as THREE from 'three';

export default abstract class SceneBase extends THREE.Scene
{
    abstract initialize(options?:any);
    abstract update(options?:any);
    abstract recieveMessage(call:string, args:any)
}