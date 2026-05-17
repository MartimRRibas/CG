import { CGFobject } from '../lib/CGF.js';

export class MyTerrain extends CGFobject {
    constructor(scene, size = 200, divisions = 40) {
        super(scene);
        this.size = size;
        this.divisions = divisions;
        this.initBuffers();
    }

    // Simple procedural height: sum of sine waves
    height(x, z) {
        const nx = x / this.size; // -0.5 to 0.5
        const nz = z / this.size; // -0.5 to 0.5

        let h = Math.sin(nx * 15) * Math.cos(nz * 12) * 2.5;
        h += Math.sin(nx * 30 + 1.2) * Math.sin(nz * 25 + 0.8) * 1.0;
        const r2 = nx * nx + nz * nz;
        h *= Math.min(1.0, r2 * 20);
        const distToEdge = Math.max(Math.abs(nx), Math.abs(nz));
        const mountainStart = 0.45;

        if (distToEdge > mountainStart) {
            let t = (distToEdge - mountainStart) / (0.5 - mountainStart);
            let baseSlope = Math.pow(t, 2) * 45;
            let peaks = 0;
            peaks += Math.abs(Math.sin(nx * 60) * Math.cos(nz * 60)) * 15;
            peaks += Math.abs(Math.sin(nx * 130) * Math.sin(nz * 110)) * 7;
            h += (baseSlope + peaks) * t;
        }

        return h;
    }

    initBuffers() {
        const N = this.divisions;
        const S = this.size;
        const half = S / 2;

        this.vertices = [];
        this.normals = [];
        this.texCoords = [];
        this.indices = [];

        for (let row = 0; row <= N; row++) {
            for (let col = 0; col <= N; col++) {
                const x = -half + (col / N) * S;
                const z = -half + (row / N) * S;
                const y = this.height(x, z);
                this.vertices.push(x, y, z);

                // Compute normal via finite differences
                const eps = S / N;
                const hL = this.height(x - eps, z);
                const hR = this.height(x + eps, z);
                const hD = this.height(x, z - eps);
                const hU = this.height(x, z + eps);
                const nx = (hL - hR) / (2 * eps);
                const nz = (hD - hU) / (2 * eps);
                const ny = 1.0;
                const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
                this.normals.push(nx / len, ny / len, nz / len);

                this.texCoords.push(col / N * 8, row / N * 8);
            }
        }

        for (let row = 0; row < N; row++) {
            for (let col = 0; col < N; col++) {
                const tl = row * (N + 1) + col;
                const tr = tl + 1;
                const bl = (row + 1) * (N + 1) + col;
                const br = bl + 1;
                this.indices.push(tl, bl, tr);
                this.indices.push(tr, bl, br);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        this.scene.gl.frontFace(this.scene.gl.CCW);
        super.display();
    }
}
