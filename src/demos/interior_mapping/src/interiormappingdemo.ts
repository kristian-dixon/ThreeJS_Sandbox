import * as THREE from 'three';
import {GUI} from 'dat.gui';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

import VertexShader from "../shaders/parallaxmapping.vs";
import FragmentShader from "../shaders/parallaxmapping.fs";


import CubeMap_nx from "../textures/CubeMapClouds/nx.png";
import CubeMap_ny from "../textures/CubeMapClouds/ny.png";
import CubeMap_pz from "../textures/CubeMapClouds/nz.png";
import CubeMap_px from "../textures/CubeMapClouds/px.png";
import CubeMap_py from "../textures/CubeMapClouds/py.png";
import CubeMap_nz from "../textures/CubeMapClouds/pz.png";

import SceneBase from '../../../SceneBase';

/**
 * A class to set up some basic scene elements to minimize code in the
 * main execution file.
 */
export default class InteriorMappingScene extends SceneBase{
   
    recieveMessage(call: string, args: any) {
        throw new Error('Method not implemented.');
    }

    // A dat.gui class debugger that is added by default
    debugger: GUI = null;

    // Setups a scene camera
    camera: THREE.PerspectiveCamera = null;

    // setup renderer
    renderer: THREE.Renderer = null;

    // setup Orbitals
    orbitals: OrbitControls = null;

    material: THREE.ShaderMaterial = null;

    // Get some basic params
    width = window.innerWidth;
    height = window.innerHeight;

    cube: THREE.Mesh;



    initialize(debug: boolean = true, addGridHelper: boolean = true){
        // setup camera
        this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, .1, 100);
        this.camera.position.z = 4;
        this.camera.position.y = 0;
        this.camera.position.x = 0;
        this.camera.lookAt(0,0.5,0);
        // setup renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById("app") as HTMLCanvasElement,
            alpha: true
        });
        this.renderer.setSize(this.width, this.height);

        // add window resizing
        InteriorMappingScene.addWindowResizing(this.camera, this.renderer);

        // sets up the camera's orbital controls
        this.orbitals = new OrbitControls(this.camera, this.renderer.domElement)

        // Adds an origin-centered grid for visual reference
        if (addGridHelper){

            // Adds a grid
            this.add(new THREE.GridHelper(10, 10, 'red'));

            // Adds an axis-helper
            this.add(new THREE.AxesHelper(3))
        }

        // set the background color
        this.background = new THREE.Color(0x884422);

        // Creates the geometry + materials
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        //const geometry = new THREE.SphereGeometry(0.5);
        geometry.computeTangents();

        let self = this;
        let p = ""

        let cubemap = new THREE.CubeTextureLoader().load([CubeMap_px, CubeMap_nx, CubeMap_py, CubeMap_ny, CubeMap_pz, CubeMap_nz])

       
        this.material = new THREE.ShaderMaterial({
            uniforms:{
                time: {value:1.0},
                ZOffset: {value: -1.0},
                tCube: { value: cubemap },
                uvScale: {value: new THREE.Vector2(1,1)},
                uvOffset: {value: new THREE.Vector2(0,0)}
                //value: new THREE.TextureLoader().load(Img)}
            },
            vertexShader: VertexShader,
            fragmentShader:FragmentShader,
        })

        let cube = new THREE.Mesh(geometry, this.material);
        //cube.position.y = .5;
        // add to scene
        this.add(cube);
        this.cube = cube;
        // setup Debugger
        if (debug) {
            this.debugger =  new GUI();

            // Add camera to debugger
            const cameraGroup = this.debugger.addFolder('Camera');
            cameraGroup.add(this.camera, 'fov', 20, 80);
            cameraGroup.add(this.camera, 'zoom', 0, 1);
            cameraGroup.open();

            const materialSettingsGroup = this.debugger.addFolder("Material Properties");
            const uvScaleGroup = materialSettingsGroup.addFolder("UV Scale");
            uvScaleGroup.add(this.material.uniforms["uvScale"].value, "x");
            uvScaleGroup.add(this.material.uniforms["uvScale"].value, "y");

            const uvOffsetGroup = materialSettingsGroup.addFolder("UV Offset");
            uvOffsetGroup.add(this.material.uniforms["uvOffset"].value, "x");
            uvOffsetGroup.add(this.material.uniforms["uvOffset"].value, "y");


            let roomDepthSetting = materialSettingsGroup.add(this.material.uniforms["ZOffset"], "value", -10, 1, 0.01);
            roomDepthSetting.name("Depth");
            materialSettingsGroup.open();
            // Add the cube with some properties
            // const cubeGroup = this.debugger.addFolder("Cube");
            // cubeGroup.add(cube.position, 'x', -10, 10);
            // cubeGroup.add(cube.position, 'y', .5, 10);
            // cubeGroup.add(cube.position, 'z', -10, 10);
            // cubeGroup.open();
        }
    }

    update(){
        this.camera.updateProjectionMatrix();
        this.renderer.render(this, this.camera);
        

        

        if(this.cube){
            // this.cube.translateX(0.1)
            //this.cube.rotateY(0.01);
        }
    }

    /**
     * Given a ThreeJS camera and renderer, resizes the scene if the
     * browser window is resized.
     * @param camera - a ThreeJS PerspectiveCamera object.
     * @param renderer - a subclass of a ThreeJS Renderer object.
     */
    static addWindowResizing(camera: THREE.PerspectiveCamera, renderer: THREE.Renderer){
        window.addEventListener( 'resize', onWindowResize, false );
        function onWindowResize(){

            // uses the global window widths and height
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize( window.innerWidth, window.innerHeight );
        }
    }
}