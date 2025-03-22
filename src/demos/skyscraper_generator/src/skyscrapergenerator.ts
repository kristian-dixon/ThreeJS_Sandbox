import { BoxGeometry, BufferAttribute, BufferGeometry, Color, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, Scene, Vector3 } from "three";
import DemoBase from "../../../SceneBase";
import { OrbitalCamera } from "../../../shared/generic_scene_elements/camera";
import { DefaultLighting } from "../../../shared/generic_scene_elements/lighting";
import { randFloat, randInt } from "three/src/math/MathUtils";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import BuildingShaderVert from "../shaders/vert.vs"
import BuildingShaderFrag from "../shaders/frag.fs"
export default class SkyScraperGeneratorDemo extends DemoBase
{
    camera: OrbitalCamera;
    scene: Scene;
    mesh:Mesh;

    settings={
        segmentsMin:3,
        segmentsMax:10,

        widthMin:2,
        widthMax:10,
        heightMin:10,
        heightMax:25,
        depthMin:2,
        depthMax:10,

        spireChance: 0.3,
        expandChance:0.2,
        expandAmountMin:2.0,
        expandAmountMax:3.0,

        insetChance: 0.5,

        taperChanceX: 0.1,
        taperChanceZ: 0.1
    }

    initialize() {
        this.scene = new Scene();
        this.camera = new OrbitalCamera(40,0.01,1000, this.renderer);
        this.camera.position.set(0,50,100);
        this.camera.controls.target = new Vector3(0,40,0);
        DefaultLighting.SetupDefaultLighting(this.scene);
        
        let cubeGeometry = new BoxGeometry()
        this.mesh = new Mesh(cubeGeometry, new CustomShaderMaterial({
            baseMaterial: MeshStandardMaterial,
            vertexShader: BuildingShaderVert,
            fragmentShader: BuildingShaderFrag
        }));
        this.mesh.rotateY(1);
        this.scene.add(this.mesh);
        this.generateBuildingGeometry();
        
        this.scene.background = new Color('black')

        Object.keys(this.settings).forEach((key)=>{
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.gui.add(this.settings, (key));
        })

        this.gui.add(this, 'generateBuildingGeometry');
    }

    generateBuildingGeometry()
    {
        if(this.mesh.geometry)
        {
            this.mesh.geometry.dispose();
        }

        let vertices = [];
        let indices = [];

        let segmentCount = randInt(this.settings.segmentsMin, this.settings.segmentsMax);
        let width =  randFloat(this.settings.widthMax - this.settings.widthMin, this.settings.widthMax);
        let depth =  randFloat(this.settings.depthMax - this.settings.depthMin, this.settings.depthMax);

        let floorHeight = 0;
        let vertexCountPerSegment = 20;
        for(let i = 0; i < segmentCount; i++)
        {
            let expansion = 0;
            if(Math.random() < this.settings.expandChance)
            {
                expansion = randFloat(this.settings.expandAmountMin, this.settings.expandAmountMax);
            }

            let topWidth = Math.random() < this.settings.taperChanceX ? randFloat(width - this.settings.widthMin, width + expansion) : width;
            let topDepth = Math.random() < this.settings.taperChanceZ ? randFloat(depth - this.settings.depthMin, width + expansion) : width;
            let height = randFloat(this.settings.heightMin, this.settings.heightMax);

            vertices.push(
                //Front wall -z
                {pos:[    width, floorHeight,          -depth],    uv:[1,0], normal:[0,0,-1]},
                {pos:[   -width, floorHeight,          -depth],    uv:[0,0], normal:[0,0,-1]},
                {pos:[-topWidth, floorHeight + height, -topDepth], uv:[0,1], normal:[0,0,-1]},
                {pos:[ topWidth, floorHeight + height, -topDepth], uv:[1,1], normal:[0,0,-1]},

                //Left wall -x
                {pos:[   -width, floorHeight,          -depth],    uv:[1,0], normal:[-1,0,0]},
                {pos:[   -width, floorHeight,           depth],    uv:[0,0], normal:[-1,0,0]},
                {pos:[-topWidth, floorHeight + height,  topDepth], uv:[0,1], normal:[-1,0,0]},
                {pos:[-topWidth, floorHeight + height, -topDepth], uv:[1,1], normal:[-1,0,0]},

                //Back wall +z
                {pos:[   -width, floorHeight,           depth],    uv:[1,0], normal:[0,0,1]},
                {pos:[    width, floorHeight,           depth],    uv:[0,0], normal:[0,0,1]},
                {pos:[ topWidth, floorHeight + height,  topDepth], uv:[0,1], normal:[0,0,1]},
                {pos:[-topWidth, floorHeight + height,  topDepth], uv:[1,1], normal:[0,0,1]},

                //Right wall +x 
                {pos:[   width, floorHeight,           depth],    uv:[1,0], normal:[1,0,0]},
                {pos:[    width, floorHeight,          -depth],    uv:[0,0], normal:[1,0,0]},
                {pos:[topWidth, floorHeight + height, -topDepth], uv:[0,1], normal:[1,0,0]},
                {pos:[topWidth, floorHeight + height,  topDepth], uv:[1,1], normal:[1,0,0]},

                //Top Group 
                {pos:[-topWidth, floorHeight + height, -topDepth], uv:[0,0], normal:[0,1,0]},
                {pos:[-topWidth, floorHeight + height,  topDepth], uv:[1,0], normal:[0,1,0]},
                {pos:[ topWidth, floorHeight + height,  topDepth], uv:[1,1], normal:[0,1,0]},
                {pos:[ topWidth, floorHeight + height, -topDepth], uv:[0,1], normal:[0,1,0]},
            );

            indices.push(
                i * vertexCountPerSegment + 0 + 0,
                i * vertexCountPerSegment + 1 + 0,
                i * vertexCountPerSegment + 2 + 0,
                i * vertexCountPerSegment + 2 + 0,
                i * vertexCountPerSegment + 3 + 0,
                i * vertexCountPerSegment + 0 + 0,

                i * vertexCountPerSegment + 0 + 4,
                i * vertexCountPerSegment + 1 + 4,
                i * vertexCountPerSegment + 2 + 4,
                i * vertexCountPerSegment + 2 + 4,
                i * vertexCountPerSegment + 3 + 4,
                i * vertexCountPerSegment + 0 + 4,

                i * vertexCountPerSegment + 0 + 8,
                i * vertexCountPerSegment + 1 + 8,
                i * vertexCountPerSegment + 2 + 8,
                i * vertexCountPerSegment + 2 + 8,
                i * vertexCountPerSegment + 3 + 8,
                i * vertexCountPerSegment + 0 + 8,

                i * vertexCountPerSegment + 0 + 12,
                i * vertexCountPerSegment + 1 + 12,
                i * vertexCountPerSegment + 2 + 12,
                i * vertexCountPerSegment + 2 + 12,
                i * vertexCountPerSegment + 3 + 12,
                i * vertexCountPerSegment + 0 + 12,

                i * vertexCountPerSegment + 0 + 16,
                i * vertexCountPerSegment + 1 + 16,
                i * vertexCountPerSegment + 2 + 16,
                i * vertexCountPerSegment + 2 + 16,
                i * vertexCountPerSegment + 3 + 16,
                i * vertexCountPerSegment + 0 + 16,
            )

            floorHeight += height;
            width = topWidth;
            depth = topDepth;

            if(Math.random() < this.settings.insetChance)
            {
                width = randFloat(width - this.settings.widthMin, width);
                depth = randFloat(depth - this.settings.depthMin, depth);
            }

            width = Math.max(2 + Math.random(),width);
            depth = Math.max(2 + Math.random(),depth);
        }

        let positions=[];
        let normals=[];
        let uvs=[];
        for(const vertex of vertices)
        {
            positions.push(...vertex.pos)
            normals.push(...vertex.normal)
            uvs.push(...vertex.uv)
        }

        let geometry = new BufferGeometry();
        geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
        geometry.setAttribute("normal", new BufferAttribute(new Float32Array(normals), 3));
        geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
        geometry.setIndex(indices)

        this.mesh.geometry = geometry;
    }

    update(options?: any): void {
        this.renderer.render(this.scene, this.camera);
    }
}