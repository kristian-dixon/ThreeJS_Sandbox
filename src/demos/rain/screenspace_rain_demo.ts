import { EquirectangularReflectionMapping, Mesh, PlaneGeometry, RepeatWrapping, Scene, ShaderMaterial, TextureLoader, Vector3, Wrapping } from "three";
import {RGBELoader} from "three/examples/jsm/loaders/RGBELoader"

import DemoBase from "../../SceneBase";
import { OrbitalCamera } from "../../shared/generic_scene_elements/camera";

import EnvironmentMap from "../../shared/assets/textures/skyboxes/hanger_exterior_cloudy_1k.hdr";
import RainMap from "./RainTexture.png";
export default class ScreenspaceRainDemo extends DemoBase
{
    camera: OrbitalCamera;
    scene: THREE.Scene;

    rainMaterialUniforms={
        time:{value:0},
        direction:{value:new Vector3(1,1,0).normalize()},
        speed:{value:1.5},

        mainTex:{value:null}
    }

    initialize(options?: any) {
        this.camera = new OrbitalCamera(40, 0.01, 100, this.renderer);
        this.scene = new Scene();

        //Load environment map
        let hdri = new RGBELoader().load(EnvironmentMap, (tex)=>{
            hdri.mapping = EquirectangularReflectionMapping
            this.scene.background = hdri;
            this.scene.environment = hdri;
        })

        let textureLoader = new TextureLoader();
        textureLoader.load(RainMap,(tex)=>{
            this.rainMaterialUniforms.mainTex.value = tex;
            tex.wrapS = tex.wrapT = RepeatWrapping;
        })

        let rainQuad = new Mesh(
            new PlaneGeometry(),
            new ShaderMaterial({
                depthTest:false,
                depthWrite:false,
                vertexShader:
                `
                    uniform vec3 direction;
                    varying vec2 screenUv;
                    varying vec3 rainDirection;

                    void main()
                    {
                        gl_Position = vec4(uv * 2.0 - 1.0, 0, 1.0);
                        rainDirection = (projectionMatrix * modelViewMatrix * vec4(direction, 0.0)).xyz;
                        screenUv = uv;
                    }
                `,
                fragmentShader:
                `
                    varying vec2 screenUv;
                    varying vec3 rainDirection;

                    uniform float time;
                    uniform float speed;
                   
                    uniform sampler2D mainTex;
                    
                    void main() {
                    
                        vec2 sampleCoords = ((screenUv*4.0) + rainDirection.xy * speed * time);
                        float rain = 1.0-texture2D(mainTex, sampleCoords).r;

                        gl_FragColor = vec4(rain,rain,rain, 0.2);
                        
                        if(1.0-rain < 0.1)
                            discard;
                    }
                `,
                uniforms: this.rainMaterialUniforms,
                transparent: true
            }
        ));
        rainQuad.frustumCulled = false;
        this.scene.add(rainQuad);

        let rainSettings = this.gui.addFolder('Rain Settings');
        rainSettings.add(this.rainMaterialUniforms.speed,"value").name('Speed');
    }

    update(options?: any): void {
        super.update();
        this.renderer.render(this.scene, this.camera);
        this.rainMaterialUniforms.time.value += this.getDeltaTime();
    }
}