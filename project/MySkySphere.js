import { CGFobject } from '../lib/CGF.js';

export class MySkySphere extends CGFobject {
    constructor(scene, radius = 300, slices = 32, stacks = 16) {
        super(scene);
        this.radius = radius;
        this.slices = slices;
        this.stacks = stacks;
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.normals = [];
        this.texCoords = [];
        this.indices = [];

        // Only upper hemisphere
        for (let st = 0; st <= this.stacks; st++) {
            const phi = (st / this.stacks) * Math.PI / 2; // 0 to PI/2
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            for (let sl = 0; sl <= this.slices; sl++) {
                const theta = (sl / this.slices) * 2 * Math.PI;
                const x = Math.cos(theta) * sinPhi;
                const y = cosPhi;
                const z = Math.sin(theta) * sinPhi;

                this.vertices.push(x * this.radius, y * this.radius, z * this.radius);
                // Inverted normals (faces inward)
                this.normals.push(-x, -y, -z);
                this.texCoords.push(sl / this.slices, 1 - st / this.stacks);
            }
        }

        for (let st = 0; st < this.stacks; st++) {
            for (let sl = 0; sl < this.slices; sl++) {
                const cur = st * (this.slices + 1) + sl;
                const next = cur + this.slices + 1;
                // Inverted winding
                this.indices.push(cur, cur + 1, next);
                this.indices.push(cur + 1, next + 1, next);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        this.scene.gl.disable(this.scene.gl.CULL_FACE);
        super.display();
        this.scene.gl.enable(this.scene.gl.CULL_FACE);
    }
}
