import { CGFobject } from '../lib/CGF.js';

// Arrow: a vertical quad cone shape
export class MyArrow extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }

    initBuffers() {
        // A simple upward-pointing arrow shape made of 2 quads:
        // - Vertical shaft
        // - Arrowhead (cone tip)
        const slices = 8;
        this.vertices = [];
        this.normals = [];
        this.texCoords = [];
        this.indices = [];

        // Arrow shaft (thin box, height 6 to 9)
        const shaftW = 0.3;
        this.vertices.push(
            -shaftW, 4, 0,   shaftW, 4, 0,
             shaftW, 7, 0,  -shaftW, 7, 0
        );
        this.normals.push(0,0,1, 0,0,1, 0,0,1, 0,0,1);
        this.texCoords.push(0,1, 1,1, 1,0, 0,0);
        this.indices.push(0,1,2, 0,2,3);

        // Arrow head (triangle on top)
        this.vertices.push(
            -0.8, 7, 0,
             0.8, 7, 0,
             0.0, 9, 0
        );
        this.normals.push(0,0,1, 0,0,1, 0,0,1);
        this.texCoords.push(0,1, 1,1, 0.5,0);
        this.indices.push(4,5,6);

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        const sc = this.scene;
        sc.gl.disable(sc.gl.CULL_FACE);
        // Two perpendicular quads (cross billboard)
        sc.pushMatrix();
        super.display();
        sc.rotate(Math.PI / 2, 0, 1, 0);
        super.display();
        sc.popMatrix();
        sc.gl.enable(sc.gl.CULL_FACE);
    }
}
