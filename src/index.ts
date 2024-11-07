
import InteriorMappingScene from "./demos/interior_mapping/src/interiormappingdemo";
import UVDisplacementScene from "./demos/uv_displacement/src/UV_Displacement";
import WhiteboardDemoScene from "./demos/whiteboard/src/whiteboarddemo";
import SceneBase from "./SceneBase";

let availableScenes = {
    uv_displacement:UVDisplacementScene,
    interior_mapping:InteriorMappingScene,
    whiteboard:WhiteboardDemoScene
}

let scene: SceneBase = null;

const urlParams = new URLSearchParams(window.location.search);
let demo = urlParams.get("demo");
if(!demo)
{
    demo = "whiteboard";
}

scene = new availableScenes[demo]();
scene.initialize();

// adds listener for iframe messages
window.addEventListener('message', function (event) {
    let origin = event.origin;

    if (origin !== "https://kristian-dixon.github.io" && origin != "http://localhost:4000") {
        console.error('Command from unknown origin rejected');
        return;
    }
    
    if (typeof event.data == 'object') {
        scene.recieveMessage(event.data.call, event.data.value)
    }
}, false);

// loops updates
function loop() {
    // scene.camera.updateProjectionMatrix();
    // scene.renderer.render(scene, scene.camera);
    //scene?.orbitals?.update()
    scene.update();
    requestAnimationFrame(loop);
}

// runs a continuous loop
requestAnimationFrame(loop);
