import * as THREE from 'three';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";


export class OrbitalCamera extends THREE.PerspectiveCamera
{
    controls:OrbitControls;

    constructor(fov:number = 40, near: number = 0.01, far: number = 100, renderer:THREE.Renderer)
    {
        super(fov, window.innerWidth/window.innerHeight, near, far)
        this.controls = new OrbitControls(this, renderer.domElement);
 
        let self=this;
        window.addEventListener('resize', ()=>{
            self.aspect = window.innerWidth / window.innerHeight;
            self.updateProjectionMatrix();
        },false)
    }

    setTarget(target:THREE.Vector3)
    {
        this.controls.target = target;
    }

    update()
    {
        this.controls.update();
    }
}