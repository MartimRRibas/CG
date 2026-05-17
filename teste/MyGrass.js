import { CGFobject } from "../lib/CGF.js";


class GrassBlade extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }
    initBuffers() {
        this.vertices = [
            -0.05,0,0, 
            0.05,0,0,
            0.03,0.4,0,
            0,0.7,0,
            -0.03,0.4,0
        ]
        this.normals = [0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1];
        this.texCoords = [0.0, 1.0,1.0, 1.0,0.0, 0.5];
        this.indices = [0,1,2, 0,2,4, 4,2,3];
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

class GrassPatch extends CGFobject {
    constructor(scene, sharedBlade) { // ← receives it
        super(scene);
        this.blade = sharedBlade;     // ← uses it, doesn't create it

        this._blades = [];
        const count = 10;
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 0.8;
            const z = (Math.random() - 0.5) * 0.8;
            const h = 0.6 + Math.random() * 0.8;
            const rot = Math.random() * Math.PI;
            const isDead = Math.random() < 0.3;
            this._blades.push({ x, z, h, rot, isDead });
        }
    }
    
    display() {
        const sc = this.scene;
        sc.gl.disable(sc.gl.CULL_FACE);

        for (const b of this._blades) {
            sc.pushMatrix();
            sc.translate(b.x, 0, b.z);
            sc.rotate(b.rot, 0, 1, 0);
            sc.scale(0.15, b.h, 1);
            this.blade.display();
            // Cross blade
            sc.rotate(Math.PI / 2, 0, 1, 0);
            this.blade.display();
            sc.popMatrix();
        }

        sc.gl.enable(sc.gl.CULL_FACE);
    }
}

export class MyGrass extends CGFobject {
    constructor(scene, splatData, splatW, splatH) {
        super(scene);
        this.sharedBlade = new GrassBlade(scene);

        this._patches = [];
        const dim = 200;
        const spacing = 2.0;

        for (let i = -dim/2; i <= dim/2; i++) {
            for (let j = -dim/2; j <= dim/2; j++) {
                const x = (i * spacing) + (Math.random() - 0.5) * 0.4;
                const z = (j * spacing) + (Math.random() - 0.5) * 0.4;

                // Sample splatmap at this world position
                const u = Math.floor(((x / 200.0) + 0.5) * splatW);
                const v = Math.floor(((z / 200.0) + 0.5) * splatH);
                const idx = (v * splatW + u) * 4;
                const g = splatData.data[idx + 1] / 255; // green channel
                const b = splatData.data[idx + 2] / 255; // blue channel

                // Only place patch if green or blue zone
                if (g < 0.3 && b < 0.3) continue;

                this._patches.push({ 
                    x, z ,
                    isDead: b > g
                });
            }
        }

        this._patchObjects = this._patches.map(() => 
            new GrassPatch(scene, this.sharedBlade)
        );
    }

    display() {
        /*const sc = this.scene;
        sc.gl.disable(sc.gl.CULL_FACE);

        for (let i = 0; i < this._patches.length; i++) {
            sc.pushMatrix();
            sc.translate(this._patches[i].x, 0, this._patches[i].z);
            this._patchObjects[i].display();
            sc.popMatrix();
        }*/

        const sc = this.scene;
        sc.gl.disable(sc.gl.CULL_FACE);

        for (let i = 0; i < this._patches.length; i++) {
            const p = this._patches[i];
            sc.pushMatrix();
            sc.translate(p.x, 0, p.z);

            if (sc._grassShaderOk && sc.grassShader) {   // ← add this guard
            sc.grassShader.setUniformsValues({ 
                uPatchPos: [p.x, p.z],
                uIsDead: p.isDead ? 1.0 : 0.0
            });
        }

            this._patchObjects[i].display();
            sc.popMatrix();
        }

        sc.gl.enable(sc.gl.CULL_FACE);
    }
}

