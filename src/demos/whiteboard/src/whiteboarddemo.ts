import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import VertexShader from "../shaders/paintbrush.vs";
import FragmentShader from "../shaders/paintbrush.fs";

import SceneBase from '../../../SceneBase';

/**
 * A class to set up some basic scene elements to minimize code in the
 * main execution file.
 */
export default class WhiteboardDemoScene extends SceneBase {
    debugger: GUI = null;

    camera: THREE.PerspectiveCamera = null;

    // setup renderer
    renderer: THREE.WebGLRenderer = null;

    // setup Orbitals
    orbitals: OrbitControls = null;

    material: THREE.Material = null;

    // Get some basic params
    width = window.innerWidth;
    height = window.innerHeight;

    cube: THREE.Mesh;

    currentPage = 0;

    renderTarget: THREE.WebGLRenderTarget;
    rtCamera: THREE.Camera;
    rtScene: THREE.Scene;

    rtCube: THREE.Mesh;
    sphere: THREE.Mesh;
    raycaster: THREE.Raycaster;
    pickPosition = { x: 0, y: 0 };

    mouseHeld = false;

    brushPos = new THREE.Vector3(0,0,0);
    paintMaterial: THREE.ShaderMaterial;


    initialize(debug: boolean = true, addGridHelper: boolean = true) {
        // setup camera
        this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, .1, 100);
        this.camera.position.z = 4;
        this.camera.position.y = 0;
        this.camera.position.x = 0;
        this.camera.lookAt(0, 0, 0);
        // setup renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById("app") as HTMLCanvasElement,
            alpha: true, 
           // preserveDrawingBuffer:true -- this is for the canvas
        });
        this.renderer.setSize(this.width, this.height);


        this.raycaster = new THREE.Raycaster();


        const rtWidth = 512;
        const rtHeight = 512;
        this.renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight);
        const rtFov = 75;
        const rtAspect = rtWidth / rtHeight;
        const rtNear = 0.1;
        const rtFar = 5;
        this.rtCamera = new THREE.PerspectiveCamera(rtFov, rtAspect, rtNear, rtFar);
        this.rtCamera.position.z = 2;

        this.rtScene = new THREE.Scene();
        this.rtScene.background = new THREE.Color('Black');



        // add window resizing
        WhiteboardDemoScene.addWindowResizing(this.camera, this.renderer);

        // sets up the camera's orbital controls
        //this.orbitals = new OrbitControls(this.camera, this.renderer.domElement)

        // set the background color
        this.background = new THREE.Color(0x884422);

        // Creates the geometry + materials
        const geometry =  new THREE.SphereGeometry(1);


        //const geometry = new THREE.SphereGeometry(0.5);
        geometry.computeTangents();

        let self = this;
        let p = ""

        //let cubemap = new THREE.CubeTextureLoader().load([CubeMap_px, CubeMap_nx, CubeMap_py, CubeMap_ny, CubeMap_pz, CubeMap_nz])


        // this.material = new THREE.ShaderMaterial({
        //     uniforms:{
        //     },
        //     vertexShader: VertexShader,
        //     fragmentShader:FragmentShader,
        //     defines:{
        //     }
        // })

        const light = new THREE.DirectionalLight(new THREE.Color(1,1,1), 1);
        light.position.set(4,10,10);
        
        this.add(light);

        this.add(new THREE.AmbientLight(new THREE.Color(1,1,1),0.1))

        this.material = new THREE.MeshPhongMaterial({
            map: this.renderTarget.texture
        });

        this.paintMaterial = new THREE.ShaderMaterial({
            uniforms:{
                brushPos:{value:this.brushPos}
            },
            vertexShader: VertexShader,
            fragmentShader: FragmentShader,
            blending: THREE.AdditiveBlending
        })

        let cube = new THREE.Mesh(geometry, this.material);
        this.rtCube = new THREE.Mesh(geometry, this.paintMaterial);
        this.rtScene.add(this.rtCube);

        let sphere = new THREE.Mesh(new THREE.SphereGeometry(1), this.material);

        //cube.position.y = .5;
        // add to scene
        this.add(cube);
        //this.add(sphere);
        this.sphere = sphere;
        this.cube = cube;
        // setup Debugger
        if (debug) {

        }


        this.pickPosition = { x: 0, y: 0 };


        function setPickPosition(event) {
            self.pickPosition.x = (event.clientX / window.innerWidth) * 2 - 1;
            self.pickPosition.y = (event.clientY / window.innerHeight) * -2 + 1;  // note we flip Y
        }

        function clearPickPosition() {
            self.pickPosition.x = -100000;
            self.pickPosition.y = -100000;
        }

        window.addEventListener('mousemove', setPickPosition);
        window.addEventListener('mouseout', clearPickPosition);
        window.addEventListener('mouseleave', clearPickPosition);
        clearPickPosition();

        window.addEventListener('mousedown', function (event) {
            self.mouseHeld = true;
        })

        window.addEventListener('mouseup', function (event) {
            self.mouseHeld = false;
        })

        window.addEventListener('touchstart', (event) => {
            // prevent the window from scrolling
            event.preventDefault();
            setPickPosition(event.touches[0]);
            self.mouseHeld = true;
          }, {passive: false});
           
          window.addEventListener('touchmove', (event) => {
            setPickPosition(event.touches[0]);
          });
           
          window.addEventListener('touchend', (event) => {
            clearPickPosition();
            self.mouseHeld = false;
        });

    }

    scenePicker(scene: THREE.Scene, camera): THREE.Vector3 {
        this.raycaster.setFromCamera(this.pickPosition, camera);
        let intersections = this.raycaster.intersectObjects(scene.children.filter((x) => x != this.sphere));

        if (intersections!.length > 0) {

            return intersections[0].point;
        }
        return null;
    }

    update() {
        let self = this;

        this.camera.updateProjectionMatrix();
        this.renderer.render(this, this.camera);

        if (this.cube) {
            // this.cube.translateX(0.1)
            //this.rtCube.rotateY(0.01);
        }


        if (this.mouseHeld) {
            let pos = self.scenePicker(self, self.camera);

            if (pos) {
                self.sphere.position.set(pos.x, pos.y, pos.z);

                self.paintMaterial.uniforms.brushPos.value = self.sphere.position;
            }

            self.renderer.autoClearColor=false;
            self.renderer.setRenderTarget(self.renderTarget);
            self.renderer.render(self.rtScene, self.rtCamera);
            self.renderer.setRenderTarget(null);
            self.renderer.autoClearColor=true;
        }
    }

    changeState(pageIndex: number) {
        if (pageIndex == this.currentPage) {
            return;
        }

        //Exit state
        switch (this.currentPage) {
            case 0: {
                break;
            }
            default: {
                break;
            }
        }

        this.currentPage = pageIndex;
        switch (this.currentPage) {
            case 0: {
                break;
            }
            default: {
                break;
            }
        }
    }

    recieveMessage(call: string, args: any) {
        this[call](args);
    }


    /**
     * Given a ThreeJS camera and renderer, resizes the scene if the
     * browser window is resized.
     * @param camera - a ThreeJS PerspectiveCamera object.
     * @param renderer - a subclass of a ThreeJS Renderer object.
     */
    static addWindowResizing(camera: THREE.PerspectiveCamera, renderer: THREE.Renderer) {
        window.addEventListener('resize', onWindowResize, false);
        function onWindowResize() {

            // uses the global window widths and height
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
}