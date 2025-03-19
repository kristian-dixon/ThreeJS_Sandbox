import { BoxGeometry, BufferAttribute, BufferGeometry, Color, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, Scene } from "three";
import DemoBase from "../../../SceneBase";
import { OrbitalCamera } from "../../../shared/generic_scene_elements/camera";
import { DefaultLighting } from "../../../shared/generic_scene_elements/lighting";
import { randFloat, randInt } from "three/src/math/MathUtils";

export default class SkyScraperGeneratorDemo extends DemoBase
{
    camera: OrbitalCamera;
    scene: Scene;
    mesh:Mesh;

    settings={
        segmentsMin:3,
        segmentsMax:10,

        widthMin:1,
        widthMax:10,
        heightMin:1,
        heightMax:15,
        depthMin:1,
        depthMax:10,

        spireChance: 0.3,
        expandChance:0.2,
        expandAmountMin:2.0,
        expandAmountMax:3.0,

        taperChanceX: 0.1,
        taperChanceZ: 0.1
    }

    initialize() {
        this.scene = new Scene();
        this.camera = new OrbitalCamera(40,0.01,1000, this.renderer);
        this.camera.position.set(0,5,10)
        DefaultLighting.SetupDefaultLighting(this.scene);
        
        let cubeGeometry = new BoxGeometry()
        this.mesh = new Mesh(cubeGeometry, new MeshStandardMaterial({color:'red'}));
        this.mesh.rotateY(1);
        this.scene.add(this.mesh);
        this.generateBuildingGeometry();
        
        //this.scene.background = new Color('black')

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
            let height = randFloat(this.settings.heightMax - this.settings.heightMin, this.settings.heightMax);

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

            if(Math.random() < 0.85)
            {
                width = randFloat(width - this.settings.widthMin, width);
                depth = randFloat(depth - this.settings.depthMin, depth);
            }
           
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
        geometry.setAttribute("uvs", new BufferAttribute(new Float32Array(uvs), 2));
        geometry.setIndex(indices)

        this.mesh.geometry = geometry;
    }

    update(options?: any): void {
        this.renderer.render(this.scene, this.camera);
    }
}