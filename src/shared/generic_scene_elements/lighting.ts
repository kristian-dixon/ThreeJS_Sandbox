import * as THREE from "three";

export class DefaultLighting
{
    static SetupDefaultLighting(scene: THREE.Object3D)
    {
        const light = new THREE.DirectionalLight(0xffffff,2);
        light.position.set(4, 10, 10);
        scene.add(light);
        scene.add(new THREE.HemisphereLight(0xffffff, 0xfdaa91, 2.0));
    }
}