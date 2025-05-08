import * as THREE from "three";

export class DefaultLighting
{
    static SetupDefaultLighting(scene: THREE.Object3D, rotation=0)
    {
        let group = new THREE.Group();
        group.rotateY(rotation);
        scene.add(group);
        const light = new THREE.DirectionalLight(0xffffff,5);
        light.position.set(4, 10, 10);
        light.rotateY(rotation);
        group.add(light);

        let hemi = new THREE.HemisphereLight(0xffff00, 0xfdaa91, 2);
        hemi.rotateY(rotation);
        group.add(hemi);
    }
}