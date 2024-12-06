import * as THREE from "three";

export class DepthPick
{
    pixelBuffer: Float32Array;
    pickingTexture: THREE.WebGLRenderTarget;
    depthTextureReader: THREE.WebGLRenderTarget;
  
    blitMesh:THREE.Mesh;
    constructor(camera:THREE.PerspectiveCamera){
        this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);
        this.pickingTexture.texture.minFilter = THREE.NearestFilter;
        this.pickingTexture.texture.magFilter = THREE.NearestFilter;
        this.pickingTexture.texture.generateMipmaps = false;
        this.pickingTexture.depthTexture = new THREE.DepthTexture(1, 1);
        this.pickingTexture.depthTexture.format = THREE.DepthFormat;
        this.pickingTexture.depthTexture.type = THREE.FloatType;
        this.depthTextureReader = new THREE.WebGLRenderTarget(1,1,{
            type:THREE.FloatType,
            format: THREE.RedFormat
        });
        this.depthTextureReader.texture.minFilter = THREE.NearestFilter;
        this.depthTextureReader.texture.magFilter = THREE.NearestFilter;
        this.depthTextureReader.texture.generateMipmaps = false;
        
        this.pixelBuffer = new Float32Array(4);
        camera.near = 3;
        camera.far = 10;
        this.blitMesh = new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.ShaderMaterial(
            {
                vertexShader:
                `
                    varying vec2 vUv;
                    void main(){        
                        vUv = uv;              
                        gl_Position = vec4(uv * 2.0 - 1.0, 0, 1.0);
                    }                  
                `,
                fragmentShader:
                `
                    #include <packing>
                    varying vec2 vUv;
                    uniform sampler2D depthTexture;
                    uniform float cameraNear;
			        uniform float cameraFar;

                    float readDepth( sampler2D depthSampler, vec2 coord ) {
                        float fragCoordZ = texture2D( depthSampler, coord ).x;
                        return fragCoordZ;
                        float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
                        return viewZ;
                    }

                    void main() {
                        float depth = readDepth( depthTexture, vec2(0.5,0.5) );
                        gl_FragColor.rgb =  (vec3( depth ));
                        gl_FragColor.a = 1.0;
                    }
                `,

                uniforms:{
                    depthTexture:{value:this.pickingTexture.depthTexture},
                    cameraNear:{value:camera.near},
                    cameraFar:{value:camera.far}
                },
                precision:'highp',
                depthTest:false
            }
        ))
    }

    pick(cssPosition:THREE.Vector2, scene: THREE.Scene, renderer:THREE.WebGLRenderer, camera:THREE.PerspectiveCamera):number
    {
        const pixelRatio = renderer.getPixelRatio();
        camera.setViewOffset(
            renderer.getContext().drawingBufferWidth,   // full width
            renderer.getContext().drawingBufferHeight,  // full top
            cssPosition.x * pixelRatio | 0,             // rect x
            cssPosition.y * pixelRatio | 0,             // rect y
            1,                                          // rect width
            1,                                          // rect height
        );

       // scene.background = new THREE.Color('yellow');
        renderer.setRenderTarget(this.pickingTexture)
        renderer.render(scene, camera);
        camera.clearViewOffset();
        renderer.setRenderTarget(null);

        renderer.setRenderTarget(this.depthTextureReader);
        renderer.render(this.blitMesh,camera);

        renderer.setRenderTarget(null);
        //read the pixel
        renderer.readRenderTargetPixels(
            this.depthTextureReader,
            0,   // x
            0,   // y
            1,   // width
            1,   // height
            this.pixelBuffer);

        return Math.abs(this.pixelBuffer[0]);
    }
}