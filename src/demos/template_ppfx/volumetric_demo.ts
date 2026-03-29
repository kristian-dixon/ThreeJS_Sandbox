import { EquirectangularReflectionMapping, Mesh, PlaneGeometry, RepeatWrapping, Scene, ShaderMaterial, TextureLoader, Vector3, Wrapping } from "three";
import {RGBELoader} from "three/examples/jsm/loaders/RGBELoader"

import DemoBase from "../../SceneBase";
import { OrbitalCamera } from "../../shared/generic_scene_elements/camera";

import EnvironmentMap from "../../shared/assets/textures/skyboxes/hanger_exterior_cloudy_1k.hdr";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass";

import VertexShader from "./shaders/fog.vs"
import FragmentShader from "./shaders/fog.fs"


export default class VolumetricDemo extends DemoBase
{
    camera: OrbitalCamera;
    scene: THREE.Scene;

    quad: FullScreenQuad;

    initialize(options?: any) {
        this.camera = new OrbitalCamera(40, 0.01, 100, this.renderer);
        this.scene = new Scene();

        //Load environment map
        let hdri = new RGBELoader().load(EnvironmentMap, (tex)=>{
            hdri.mapping = EquirectangularReflectionMapping
            this.scene.background = hdri;
            this.scene.environment = hdri;
        })

        let material = new ShaderMaterial({
            vertexShader: VertexShader,
            fragmentShader: FragmentShader
        });
        this.quad = new FullScreenQuad(material);
    }

    update(options?: any): void {
        super.update();

        this.renderer.render(this.scene, this.camera);
        this.quad.render(this.renderer);
    }
}