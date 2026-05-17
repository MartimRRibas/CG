import { CGFobject, CGFappearance } from '../lib/CGF.js';

// ── Shared primitives ──────────────────────────────────────────────────────

class MyBox extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }
    initBuffers() {
        this.vertices = [
            -0.5,-0.5, 0.5,  0.5,-0.5, 0.5,  0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
             0.5,-0.5,-0.5, -0.5,-0.5,-0.5, -0.5, 0.5,-0.5,  0.5, 0.5,-0.5,
            -0.5,-0.5,-0.5, -0.5,-0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5,-0.5,
             0.5,-0.5, 0.5,  0.5,-0.5,-0.5,  0.5, 0.5,-0.5,  0.5, 0.5, 0.5,
            -0.5, 0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5,-0.5, -0.5, 0.5,-0.5,
            -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5,-0.5, 0.5, -0.5,-0.5, 0.5,
        ];
        this.normals = [
            0,0,1, 0,0,1, 0,0,1, 0,0,1,
            0,0,-1,0,0,-1,0,0,-1,0,0,-1,
            -1,0,0,-1,0,0,-1,0,0,-1,0,0,
            1,0,0, 1,0,0, 1,0,0, 1,0,0,
            0,1,0, 0,1,0, 0,1,0, 0,1,0,
            0,-1,0,0,-1,0,0,-1,0,0,-1,0,
        ];
        this.texCoords = [];
        for (let i = 0; i < 6; i++) this.texCoords.push(0,0,1,0,1,1,0,1);
        this.indices = [];
        for (let i = 0; i < 6; i++) {
            const b = i * 4;
            this.indices.push(b, b+1, b+2, b, b+2, b+3);
        }
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

// Triangular prism for the roof (ridge runs along Z)
class MyPrism extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }
    initBuffers() {
        this.vertices = [
            // Front triangle
            -1, 0, 0.5,   1, 0, 0.5,   0, 1, 0.5,
            // Back triangle
             1, 0,-0.5,  -1, 0,-0.5,   0, 1,-0.5,
            // Bottom quad
            -1, 0,-0.5,   1, 0,-0.5,   1, 0, 0.5,  -1, 0, 0.5,
            // Left slope
            -1, 0, 0.5,   0, 1, 0.5,   0, 1,-0.5,  -1, 0,-0.5,
            // Right slope
             1, 0,-0.5,   0, 1,-0.5,   0, 1, 0.5,   1, 0, 0.5,
        ];
        this.normals = [
            0,0,1,  0,0,1,  0,0,1,
            0,0,-1, 0,0,-1, 0,0,-1,
            0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
            -0.707, 0.707, 0, -0.707, 0.707, 0, -0.707, 0.707, 0, -0.707, 0.707, 0,
             0.707, 0.707, 0,  0.707, 0.707, 0,  0.707, 0.707, 0,  0.707, 0.707, 0,
        ];
        this.texCoords = [
            0,1, 1,1, 0.5,0,
            0,1, 1,1, 0.5,0,
            0,0, 1,0, 1,1, 0,1,
            0,1, 1,1, 1,0, 0,0,
            0,0, 1,0, 1,1, 0,1,
        ];
        this.indices = [
            0,1,2,
            3,4,5,
            6,7,8,  6,8,9,
            10,11,12, 10,12,13,
            14,15,16, 14,16,17,
        ];
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

// Flat circle on the XZ plane (radius = 1, y = 0)
class MyCircle extends CGFobject {
    constructor(scene, slices = 64) {
        super(scene);
        this.slices = slices;
        this.initBuffers();
    }
    initBuffers() {
        this.vertices  = [0, 0, 0];
        this.normals   = [0, 1, 0];
        this.texCoords = [0.5, 0.5];

        for (let i = 0; i <= this.slices; i++) {
            const a = (i / this.slices) * 2 * Math.PI;
            this.vertices.push(Math.cos(a), 0, Math.sin(a));
            this.normals.push(0, 1, 0);
            this.texCoords.push(0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5);
        }

        this.indices = [];
        for (let i = 1; i <= this.slices; i++) {
            this.indices.push(0, i, i + 1);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

// ── MyBarn ─────────────────────────────────────────────────────────────────

export class MyBarn extends CGFobject {
    constructor(scene) {
        super(scene);

        this.box    = new MyBox(scene);
        this.roof   = new MyPrism(scene);
        this.circle = new MyCircle(scene, 64);

        // Barn body – warm red/brown
        this.barnApp = new CGFappearance(scene);
        this.barnApp.setAmbient(0.45, 0.12, 0.08, 1);
        this.barnApp.setDiffuse(0.70, 0.20, 0.12, 1);
        this.barnApp.setSpecular(0.05, 0.02, 0.02, 1);
        this.barnApp.setShininess(10);

        // Roof – dark brown
        this.roofApp = new CGFappearance(scene);
        this.roofApp.setAmbient(0.25, 0.15, 0.05, 1);
        this.roofApp.setDiffuse(0.40, 0.25, 0.10, 1);
        this.roofApp.setSpecular(0.05, 0.05, 0.02, 1);
        this.roofApp.setShininess(8);

        // Delivery circle – inactive (golden straw colour)
        this.circleNormalApp = new CGFappearance(scene);
        this.circleNormalApp.setAmbient(0.50, 0.45, 0.05, 1);
        this.circleNormalApp.setDiffuse(0.80, 0.72, 0.10, 1);
        this.circleNormalApp.setSpecular(0.05, 0.05, 0.00, 1);
        this.circleNormalApp.setShininess(5);

        // Delivery circle – active (bright green)
        this.circleActiveApp = new CGFappearance(scene);
        this.circleActiveApp.setAmbient(0.05, 0.55, 0.05, 1);
        this.circleActiveApp.setDiffuse(0.10, 0.90, 0.10, 1);
        this.circleActiveApp.setSpecular(0.10, 0.30, 0.10, 1);
        this.circleActiveApp.setShininess(20);
    }

    /**
     * @param {number}  bx              barn centre world X
     * @param {number}  bz              barn centre world Z
     * @param {boolean} wagonInCircle   true → highlight delivery area green
     */
    display(bx, bz, wagonInCircle) {
        const sc = this.scene;

        sc.pushMatrix();
        sc.translate(bx, 0, bz);

        // ── Body ──────────────────────────────────────────────────────────
        this.barnApp.apply();
        sc.pushMatrix();
        sc.translate(0, 7, 0);
        sc.scale(16, 14, 20);
        this.box.display();
        sc.popMatrix();

        // ── Roof ──────────────────────────────────────────────────────────
        this.roofApp.apply();
        sc.pushMatrix();
        sc.translate(0, 14, 0);
        sc.scale(18, 7, 20);
        this.roof.display();
        sc.popMatrix();

        // ── Delivery circle (slightly above ground to avoid z-fighting) ───
        if (wagonInCircle) {
            this.circleActiveApp.apply();
        } else {
            this.circleNormalApp.apply();
        }

        sc.pushMatrix();
        sc.translate(0, 0.05, 13);
        sc.scale(12, 1, 12);
        this.circle.display();
        sc.popMatrix();

        sc.popMatrix();
    }
}
