import { BoxGeometry, BufferAttribute, BufferGeometry, Color, Mapping, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, RepeatWrapping, Scene, TextureLoader, Vector2, Vector3, Wrapping } from "three";
import DemoBase from "../../../SceneBase";
import { OrbitalCamera } from "../../../shared/generic_scene_elements/camera";
import { DefaultLighting } from "../../../shared/generic_scene_elements/lighting";
import { randFloat, randInt } from "three/src/math/MathUtils";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import BuildingShaderVert from "../shaders/vert.vs"
import BuildingShaderFrag from "../shaders/frag.fs"

import NormalMap from "../../../shared/assets/textures/normal_map/bumpyNormalMap.jpg"
import InteriorMap from '../../../shared/assets/textures/skyboxes/IndoorEnvironment.jpg'

export default class SkyScraperGeneratorDemo extends DemoBase
{
    camera: OrbitalCamera;
    scene: Scene;
    mesh:Mesh;

    autoApply:boolean=false;

    settings={
        iterationsMin:3,
        iterationsMax:5,

        initalWidth:10,
        widthMaxChange:2,

        initialDepth:10,
        depthMaxChange:2,


        heightMin:10,
        heightMax:15,
         
        expandChance:0.2,
        expandAmountMin:2.0,
        expandAmountMax:3.0,

        insetChance: 0.25,

        taperChanceX: 0.1,
        taperChanceZ: 0.1
    }

    initialize() {
        this.scene = new Scene();
        this.camera = new OrbitalCamera(40,0.01,1000, this.renderer);
        this.camera.position.set(0,30,100);
        this.camera.controls.target = new Vector3(0,25,0);
        DefaultLighting.SetupDefaultLighting(this.scene, -1);
        
        let cubeGeometry = new BoxGeometry()
        let material = new CustomShaderMaterial({
            baseMaterial: MeshStandardMaterial,
            vertexShader: BuildingShaderVert,
            fragmentShader: BuildingShaderFrag,
            bumpScale:1,
            uniforms:{
                interiorMap:{value:null}
            }
        })
        this.mesh = new Mesh(cubeGeometry, material);
        this.mesh.rotateY(1);
        this.scene.add(this.mesh);
        this.generateBuildingGeometry();

        let textureLoader = new TextureLoader();
        textureLoader.load(NormalMap, (tex)=>{
            
            tex.wrapS = tex.wrapT = RepeatWrapping;
            tex.repeat = new Vector2(0.01,0.01);
            material["bumpMap"] = tex;
            material.needsUpdate = true;
        })

        textureLoader.load(InteriorMap, (tex)=>{
            tex.wrapS = tex.wrapT = RepeatWrapping;
            material.uniforms["interiorMap"].value = tex;
        })
        
        this.scene.background = new Color('black')

        Object.keys(this.settings).forEach((key)=>{
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.gui.add(this.settings, (key)).onChange((x)=>{
                if(this.autoApply)
                {
                    this.generateBuildingGeometry();
                }
            });
        })

        this.gui.add(this, 'autoApply');

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

        let segmentCount = randInt(this.settings.iterationsMin, this.settings.iterationsMax);
        let width =  randFloat(this.settings.initalWidth - this.settings.widthMaxChange, this.settings.initalWidth);
        let depth =  randFloat(this.settings.initialDepth - this.settings.depthMaxChange, this.settings.initialDepth);

        let floorHeight = 0;
        let vertexCountPerSegment = 20;
        for(let i = 0; i < segmentCount; i++)
        {
            let expansion = 0;
            if(Math.random() < this.settings.expandChance)
            {
                expansion = randFloat(this.settings.expandAmountMin, this.settings.expandAmountMax);
            }

            let topWidth = Math.random() < this.settings.taperChanceX ? randFloat(width - this.settings.widthMaxChange, width + expansion) : width;
            let topDepth = Math.random() < this.settings.taperChanceZ ? randFloat(depth - this.settings.depthMaxChange, depth + expansion) : depth;
            let height = randFloat(this.settings.heightMin, this.settings.heightMax);

            width = Math.abs(width);
            depth = Math.abs(depth);
            topDepth = Math.abs(topDepth);
            topWidth = Math.abs(topWidth);
            
            vertices.push(
                //Front wall -z
                {pos:[    width, floorHeight,          -depth],    uv:[width,floorHeight],              normal:[0,0,-1], segmentMetaData:[width,topWidth,height,floorHeight]},
                {pos:[   -width, floorHeight,          -depth],    uv:[-width,floorHeight],             normal:[0,0,-1], segmentMetaData:[width,topWidth,height,floorHeight]},
                {pos:[-topWidth, floorHeight + height, -topDepth], uv:[-topWidth,floorHeight + height], normal:[0,0,-1], segmentMetaData:[width,topWidth,height,floorHeight]},
                {pos:[ topWidth, floorHeight + height, -topDepth], uv:[topWidth,floorHeight + height],  normal:[0,0,-1], segmentMetaData:[width,topWidth,height,floorHeight]},

                //Left wall -x
                {pos:[   -width, floorHeight,          -depth],    uv:[-depth,floorHeight],              normal:[-1,0,0], segmentMetaData:[depth,topDepth,height,floorHeight]},
                {pos:[   -width, floorHeight,           depth],    uv:[depth,floorHeight],             normal:[-1,0,0], segmentMetaData:[depth,topDepth,height,floorHeight]},
                {pos:[-topWidth, floorHeight + height,  topDepth], uv:[topDepth,floorHeight + height], normal:[-1,0,0], segmentMetaData:[depth,topDepth,height,floorHeight]},
                {pos:[-topWidth, floorHeight + height, -topDepth], uv:[-topDepth,floorHeight + height],  normal:[-1,0,0], segmentMetaData:[depth,topDepth,height,floorHeight]},

                //Back wall +z
                {pos:[   -width, floorHeight,           depth],    uv:[-width,floorHeight],              normal:[ 0,0,1], segmentMetaData:[width,topWidth,height,floorHeight]},
                {pos:[    width, floorHeight,           depth],    uv:[width,floorHeight],             normal:[ 0,0,1], segmentMetaData:[width,topWidth,height,floorHeight]},
                {pos:[ topWidth, floorHeight + height,  topDepth], uv:[topWidth,floorHeight + height], normal:[ 0,0,1], segmentMetaData:[width,topWidth,height,floorHeight]},
                {pos:[-topWidth, floorHeight + height,  topDepth], uv:[-topWidth,floorHeight + height],  normal:[ 0,0,1], segmentMetaData:[width,topWidth,height,floorHeight]},

                //Right wall +x 
                {pos:[    width, floorHeight,           depth],    uv:[depth,floorHeight],              normal:[ 1,0,0], segmentMetaData:[depth,topDepth,height,floorHeight]},
                {pos:[    width, floorHeight,          -depth],    uv:[-depth,floorHeight],             normal:[ 1,0,0], segmentMetaData:[depth,topDepth,height,floorHeight]},
                {pos:[ topWidth, floorHeight + height, -topDepth], uv:[-topDepth,floorHeight + height], normal:[ 1,0,0], segmentMetaData:[depth,topDepth,height,floorHeight]},
                {pos:[ topWidth, floorHeight + height,  topDepth], uv:[topDepth,floorHeight + height],  normal:[ 1,0,0], segmentMetaData:[depth,topDepth,height,floorHeight]},

                //Top Group 
                {pos:[-topWidth, floorHeight + height, -topDepth], uv:[0,0], normal:[ 0,1,0], segmentMetaData:[width,topWidth,height,floorHeight]},
                {pos:[-topWidth, floorHeight + height,  topDepth], uv:[1,0], normal:[ 0,1,0], segmentMetaData:[width,topWidth,height,floorHeight]},
                {pos:[ topWidth, floorHeight + height,  topDepth], uv:[1,1], normal:[ 0,1,0], segmentMetaData:[width,topWidth,height,floorHeight]},
                {pos:[ topWidth, floorHeight + height, -topDepth], uv:[0,1], normal:[ 0,1,0], segmentMetaData:[width,topWidth,height,floorHeight]},
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
                width = randFloat(width - this.settings.widthMaxChange, width);
                depth = randFloat(depth - this.settings.depthMaxChange, depth);
            }

            width = Math.max(2 + Math.random(),width);
            depth = Math.max(2 + Math.random(),depth);
        }

        let positions=[];
        let normals=[];
        let uvs=[];
        let metadata=[];
        for(const vertex of vertices)
        {
            positions.push(...vertex.pos);
            normals.push(...vertex.normal);
            uvs.push(...vertex.uv);
            metadata.push(...vertex.segmentMetaData);
        }

        let geometry = new BufferGeometry();
        geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
        geometry.setAttribute("normal", new BufferAttribute(new Float32Array(normals), 3));
        geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
        geometry.setAttribute("metadata", new BufferAttribute(new Float32Array(metadata), 4));
        geometry.setIndex(indices)
        geometry.computeVertexNormals();
        geometry.computeTangents();

        this.mesh.geometry = geometry;
    }

    update(options?: any): void {
        this.renderer.render(this.scene, this.camera);
    }
}