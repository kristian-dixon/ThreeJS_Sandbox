import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

import DemoBase from "../../SceneBase";
import { OrbitalCamera } from "../../shared/generic_scene_elements/camera";
import { DefaultLighting } from "../../shared/generic_scene_elements/lighting";

import EnvironmentMap from "../../shared/assets/textures/skyboxes/medieval_cafe_1k.hdr";
import NormalMap from "./textures/WhiteHexagonalTiles01_1K_Normal.png"


import vertexShader from "./shaders/astrosphere.vs";
import fragShader from "./shaders/astrosphere.fs";

export class AstrobotSphereDemo extends DemoBase
{
    scene: THREE.Scene = null;
    camera: OrbitalCamera;

    movingBall: THREE.Mesh;
    ballPos: THREE.Vector3 = new THREE.Vector3(0,0,0);

    spring = 
    {
        strength: 1.105,
        dampen: 0.99,
        velocity: new THREE.Vector3(0,0,0),
        position: new THREE.Vector3(0.5,0,0),
        anchorPosition: new THREE.Vector3(0.25,0,0),

        update:(dt:number)=>{
            let self = this.spring;
            let displacement = new THREE.Vector3();
            displacement.subVectors(self.anchorPosition, self.position);
            displacement.multiplyScalar(self.strength);
            
            let acceleration = displacement;
            self.velocity.add(acceleration);
        
            self.velocity.multiplyScalar(self.dampen);

            let scaledVelocity = new THREE.Vector3(self.velocity.x * dt, self.velocity.y * dt, self.velocity.z * dt);
            self.position.add(scaledVelocity);

            this.uniforms.impactDepth.value = (new THREE.Vector3().copy(this.uniforms.impactNormal.value).dot(self.velocity));
           // this.uniforms.impactDepth.value = 
            
            
            let dir = (new THREE.Vector3().subVectors(self.anchorPosition, self.position));
            let length = dir.length();
            
            this.uniforms.impactDepth.value = -length * Math.sign(dir.normalize().dot(this.uniforms.impactNormal.value));


        }
    }

    uniforms = 
    {
        normalMap:{value:null},
        impactNormal:{value:new THREE.Vector3().copy(this.spring.anchorPosition).normalize()},
        impactDepth:{value:0.0}
    }

    

    initialize(options?: any) {
        this.camera = new OrbitalCamera(60, .1, 10, this.renderer);
        this.scene = new THREE.Scene();
        this.scene.position.set(0,0,-1);
        
        if(window.self == window.top)
        {
            this.scene.background = new THREE.Color("Black");
        }

        DefaultLighting.SetupDefaultLighting(this.scene);
        let hdri = new RGBELoader().load(EnvironmentMap, (tex)=>{
            hdri.mapping = THREE.EquirectangularReflectionMapping
            this.scene.background = hdri;
            this.scene.environment = hdri;
        })

        let material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragShader,
            transparent:true,
            uniforms:this.uniforms,
            side:THREE.DoubleSide,
            depthWrite:false
        });

        let textureLoader = new THREE.TextureLoader();
        textureLoader.load(NormalMap, (tex)=>{
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            this.uniforms.normalMap.value = tex;
        })

        let geometry = new THREE.SphereGeometry(0.25, 128, 128);
        geometry.computeTangents();

        let mesh = new THREE.Mesh(geometry, material);

        this.movingBall = new THREE.Mesh(new THREE.SphereGeometry(0.025), new THREE.MeshStandardMaterial({
            color:"red"
        }));

        this.scene.add(mesh);
        this.scene.add(this.movingBall);
    }

    elapsedTime:number = 0;
    update(options?: any): void {
        super.update(options);
        //this.camera.controls.update();
        this.elapsedTime += this.getDeltaTime() * 0.5;
        

        
        this.spring.update(this.getDeltaTime());
        this.movingBall.position.copy(this.spring.position);

        this.renderer.render(this.scene, this.camera);
    }
}