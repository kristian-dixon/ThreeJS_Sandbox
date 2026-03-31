import { Color, EquirectangularReflectionMapping, Matrix4, Mesh, NormalBlending, Object3D, PlaneGeometry, RepeatWrapping, Scene, ShaderMaterial, TextureLoader, Vector3, Vector4, Wrapping } from "three";
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

    uniforms={
        inverseProjection:{value: new Matrix4()},
        inverseView:{value:new Matrix4()},
        sphereParams:{value:new Vector4(0,0,-5,1)},
        absorbtionCoefficent:{value:0.6},
        stepDistance:{value:0.075},
        light:{value:
            {
                dir:new Vector3(0.7,1,-0.3),
                color:new Color(0,1,0)
            }
        },
        cameraPos:{value:new Vector3(0,0,0)}
    }

    initialize(options?: any) {
        let self = this;
        this.camera = new OrbitalCamera(40, 0.01, 100, this.renderer);
        this.camera.setTarget(new Vector3(0,0,-4.75));
        //this.camera.controls.center = new Vector3(0,0,-5);
        this.scene = new Scene();
        

        //Load environment map
        let hdri = new RGBELoader().load(EnvironmentMap, (tex)=>{
            hdri.mapping = EquirectangularReflectionMapping
            this.scene.background = hdri;
            this.scene.environment = hdri;
        })

        let material = new ShaderMaterial({
            vertexShader: VertexShader,
            fragmentShader: FragmentShader,
            uniforms:this.uniforms,
            transparent:true,
            blending:NormalBlending,
            precision:"highp"
        });
        this.quad = new FullScreenQuad(material);

        let volumeGui = this.gui.addFolder("Volume Parameters");
        let positionGui = volumeGui.addFolder("Position");
        positionGui.add(this.uniforms.sphereParams.value,"x");
        positionGui.add(this.uniforms.sphereParams.value,"y");
        positionGui.add(this.uniforms.sphereParams.value,"z");
        volumeGui.add(this.uniforms.sphereParams.value,"w").name("Radius");
        volumeGui.add(this.uniforms.absorbtionCoefficent, "value").name("Absorbtion Coefficient").step(0.01);
        volumeGui.add(this.uniforms.stepDistance, "value", 0.001).name("Inscattering Step Distance").step(0.001);

        let lightGui = this.gui.addFolder("Light Parameters");
        positionGui = lightGui.addFolder("Direction");
        positionGui.add(this.uniforms.light.value.dir,"x",-1,1,0.01);
        positionGui.add(this.uniforms.light.value.dir,"y",-1,1,0.01);
        positionGui.add(this.uniforms.light.value.dir,"z",-1,1,0.01);
        lightGui.addColor(this.uniforms.light.value, "color").max(1);

    }

    update(options?: any): void {
        super.update();
        this.renderer.render(this.scene, this.camera);
        this.uniforms.inverseProjection.value = this.camera.projectionMatrixInverse;
        this.uniforms.inverseView.value = this.camera.matrixWorld;
        this.uniforms.cameraPos.value = this.camera.position;
        this.quad.material.needsUpdate = true;
        this.quad.render(this.renderer);
        //
        
        console.log(this.camera.position)

        //console.log(this.camera.projectionMatrixInverse);
    }
}