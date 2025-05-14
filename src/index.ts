
import InteriorMappingScene from "./demos/interior_mapping/src/interiormappingdemo";
import InteriorMappingARScene from "./demos/interior_mapping/src/interiormapping_ar";
import LowResScene from "./demos/low_res_filter/src/lowresfilter";
import RefractionScene from "./demos/refraction/src/refraction";
import UVDisplacementScene from "./demos/uv_displacement/src/UV_Displacement";
import WhiteboardDemoScene from "./demos/whiteboard/src/whiteboarddemo";
import ScreenspaceRainDemo from "./demos/rain/screenspace_rain_demo";
import DemoBase from "./SceneBase";
import SkyScraperGeneratorDemo from "./demos/skyscraper_generator/src/skyscrapergenerator";
import { SteepParallaxDemo } from "./demos/steep_parallax/steep_parallax";

let availableScenes = {
    uv_displacement:UVDisplacementScene,
    interior_mapping:InteriorMappingScene,
    interior_mapping_ar:InteriorMappingARScene,
    whiteboard:WhiteboardDemoScene,
    lowresfilter:LowResScene,
    refraction:RefractionScene,
    rain:ScreenspaceRainDemo,
    skyscraper_generator:SkyScraperGeneratorDemo,
    steep_parallax:SteepParallaxDemo
}

let scene: DemoBase = null;

const urlParams = new URLSearchParams(window.location.search);
let demo = urlParams.get("demo");
if(!demo)
{
    demo = "steep_parallax";
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

scene.renderer.setAnimationLoop(loop);
// loops updates
function loop() {
    // scene.camera.updateProjectionMatrix();
    // scene.renderer.render(scene, scene.camera);
    //scene?.orbitals?.update()
    scene.update();
    //requestAnimationFrame(loop);
}

// runs a continuous loop
//requestAnimationFrame(loop);
