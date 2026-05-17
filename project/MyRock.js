import { CGFobject } from '../lib/CGF.js';

export class MyRock extends CGFobject {
    constructor(scene, slices = 12, stacks = 8, seed = Math.random()) {
        super(scene);
        this.slices = slices;
        this.stacks = stacks;
        this.seed = seed;
        this.initBuffers();
    }

    // Simple pseudo-random based on seed
    _rand(n) {
        const x = Math.sin(n * 127.1 + this.seed * 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    initBuffers() {
        this.vertices = []; this.normals = []; this.texCoords = []; this.indices = [];
        const N = this.slices, S = this.stacks;

        for (let st = 0; st <= S; st++) {
            const phi = (st / S) * Math.PI;
            const sinP = Math.sin(phi), cosP = Math.cos(phi);

            for (let sl = 0; sl <= N; sl++) {
                const theta = (sl / N) * 2 * Math.PI;
                const sinT = Math.sin(theta), cosT = Math.cos(theta);

                // Base sphere position
                let x = sinP * cosT;
                let y = cosP;
                let z = sinP * sinT;

                // Vertex perturbation
                const idx = st * (N + 1) + sl;
                const perturb = 0.3 * (this._rand(idx * 7 + 1) - 0.5);
                const r = 1.0 + perturb;

                this.vertices.push(x * r, y * r, z * r);
                this.normals.push(x, y, z);
                this.texCoords.push(sl / N, st / S);
            }
        }

        for (let st = 0; st < S; st++) {
            for (let sl = 0; sl < N; sl++) {
                const cur = st * (N + 1) + sl;
                const next = cur + N + 1;
                this.indices.push(cur, cur + 1, next);
                this.indices.push(cur + 1, next + 1, next);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        const sc = this.scene;
        // Flatten slightly for rock look
        sc.pushMatrix();
        sc.scale(1.0, 0.6, 1.0);
        super.display();
        sc.popMatrix();
    }
}
