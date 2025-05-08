import * as THREE from "three";
import DemoBase from "../../SceneBase";
import { OrbitalCamera } from "../../shared/generic_scene_elements/camera";
import { DefaultLighting } from "../../shared/generic_scene_elements/lighting";

export class SteepParallaxDemo extends DemoBase
{
    camera: THREE.Camera;
    scene: THREE.Scene;

    materialUniforms = {
        albedoMap: {value:null},
        normalMap: {value:null},
        bumpScale: {value:0.05}
    }

    initialize(options?: any) {
        let quad = new THREE.PlaneGeometry(1,1);
        this.scene = new THREE.Scene();
        this.camera = new OrbitalCamera(70,0.001,10.0,this.renderer);

        let mesh = new THREE.Mesh(quad, new THREE.MeshStandardMaterial());
        mesh.position.setZ(-1.0);
        this.scene.add(mesh);

        DefaultLighting.SetupDefaultLighting(this.scene);
        this.scene.background = new THREE.Color("Green");
    }

    override update(options?: any): void {
        super.update(options);
        this.renderer.render(this.scene, this.camera);
    }
    
}