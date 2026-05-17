import { CGFobject } from '../lib/CGF.js';

/**
 * Cylinder along the Y axis: bottom at y=0, top at y=1, radius=1.
 * We will rotate it in display() so it lies along X (a round bale on its side).
 */
class MyCylinder extends CGFobject {
    constructor(scene, slices = 20) {
        super(scene);
        this.slices = slices;
        this.initBuffers();
    }
    initBuffers() {
        this.vertices = []; this.normals = []; this.texCoords = []; this.indices = [];
        const N = this.slices;
        for (let i = 0; i <= N; i++) {
            const a = (i / N) * 2 * Math.PI;
            const c = Math.cos(a), s = Math.sin(a);
            // bottom ring (y=0) then top ring (y=1)
            this.vertices.push(c, 0, s,  c, 1, s);
            this.normals.push(c, 0, s,   c, 0, s);
            this.texCoords.push(i / N, 0,  i / N, 1);
        }
        for (let i = 0; i < N; i++) {
            const b = i * 2;
            this.indices.push(b, b+2, b+1,  b+1, b+2, b+3);
        }
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

/**
 * Flat disk in the XZ plane, facing +Y (normal = +Y).
 * centre at origin, radius = 1.
 */
class MyDisk extends CGFobject {
    constructor(scene, slices = 20) {
        super(scene);
        this.slices = slices;
        this.initBuffers();
    }
    initBuffers() {
        // Centre vertex
        this.vertices  = [0, 0, 0];
        this.normals   = [0, 1, 0];
        this.texCoords = [0.5, 0.5];

        const N = this.slices;
        for (let i = 0; i <= N; i++) {
            const a = (i / N) * 2 * Math.PI;
            const c = Math.cos(a), s = Math.sin(a);
            this.vertices.push(c, 0, s);
            this.normals.push(0, 1, 0);
            this.texCoords.push(0.5 + c * 0.5, 0.5 + s * 0.5);
        }
        this.indices = [];
        for (let i = 1; i <= N; i++) this.indices.push(0, i, i + 1);

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

export class MyHayBale extends CGFobject {
    constructor(scene) {
        super(scene);
        this.cylinder = new MyCylinder(scene, 20);
        this.disk     = new MyDisk(scene, 20);
    }

    display() {
        const sc = this.scene;

        // A round hay bale: a short fat cylinder lying on its side.
        // Strategy:
        //   - Cylinder runs along Y (y=0 to y=1, radius=1 in XZ).
        //   - We want it lying along X, radius in YZ.
        //   - rotate(-PI/2, 0,0,1): Y-axis → X-axis  (cylinder now runs along X)
        //   - scale(width, radius, radius): width along X, radius in YZ
        //
        // After rotate(-PI/2, 0,0,1):
        //   original Y  →  +X   (length axis)
        //   original X  →  -Y   (radial)
        //   original Z  →  +Z   (radial)
        //
        // The cylinder body goes from x=0 to x=+width (original y=0..1 → x=0..width).
        // Bottom cap (y=0 in original) is now at x=0, facing -X.
        // Top    cap (y=1 in original) is now at x=+width, facing +X.

        const WIDTH  = 2.0;   // bale width  (along X)
        const RADIUS = 1.5;   // bale radius (in YZ)

        sc.pushMatrix();

        // Centre the bale: shift -WIDTH/2 along X so it's centred at origin
        sc.translate(-WIDTH / 2, 0, 0);

        // Tilt the cylinder to lie along X
        sc.rotate(-Math.PI / 2, 0, 0, 1);

        // Scale: Y (length) → WIDTH, XZ (radius) → RADIUS
        sc.scale(RADIUS, WIDTH, RADIUS);

        // ── Cylinder body ─────────────────────────────────────────────────
        this.cylinder.display();

        // ── Bottom cap at y=0, facing -Y (which after rotation = facing -X) ──
        // The disk normal is +Y; we need it facing -Y for the bottom, so flip it.
        sc.pushMatrix();
        sc.rotate(Math.PI, 1, 0, 0);   // flip disk to face -Y
        this.disk.display();
        sc.popMatrix();

        // ── Top cap at y=1, facing +Y ────────────────────────────────────
        sc.pushMatrix();
        sc.translate(0, 1, 0);
        this.disk.display();
        sc.popMatrix();

        sc.popMatrix();
    }
}
