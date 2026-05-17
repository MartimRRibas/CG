import { CGFobject } from '../lib/CGF.js';

// Single grass blade (a quad)
class GrassBlade extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }
    initBuffers() {
        // Vertical quad: bottom at y=0, top at y=1
        this.vertices = [
            -0.5, 0, 0,
             0.1, 0, 0,
             0.1, 1, 0,
            -0.1, 1, 0,
        ];
        this.normals = [0,0,1, 0,0,1, 0,0,1, 0,0,1];
        this.texCoords = [0,1, 1,1, 1,0, 0,0];
        this.indices = [0,1,2, 0,2,3];
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

export class MyGrass extends CGFobject {
    constructor(scene) {
        super(scene);
        this.blade = new GrassBlade(scene);

        // Generate grass blade positions
        this._blades = [];
        const count = 20;
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 5;
            const z = (Math.random() - 0.5) * 5;
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
