import { CGFobject } from '../lib/CGF.js';

export class MySun extends CGFobject {
    constructor(scene) {
        super(scene);
        this.slices = 16;
        this.stacks = 16;
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.normals = [];
        this.texCoords = [];
        this.indices = [];

        const N = this.slices, S = this.stacks;

        for (let st = 0; st <= S; st++) {
            const phi = (st / S) * Math.PI;
            for (let sl = 0; sl <= N; sl++) {
                const theta = (sl / N) * 2 * Math.PI;
                const x = Math.sin(phi) * Math.cos(theta);
                const y = Math.cos(phi);
                const z = Math.sin(phi) * Math.sin(theta);
                this.vertices.push(x, y, z);
                this.normals.push(x, y, z);
                this.texCoords.push(sl / N, st / S);
            }
        }

        for (let st = 0; st < S; st++) {
            for (let sl = 0; sl < N; sl++) {
                const c = st * (N + 1) + sl;
                const n = c + N + 1;
                this.indices.push(c, c + 1, n, c + 1, n + 1, n);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        super.display();
    }
}
