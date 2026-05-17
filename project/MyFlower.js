import { CGFobject } from '../lib/CGF.js';

class MySphere extends CGFobject {
    constructor(scene, slices = 8, stacks = 8) {
        super(scene);
        this.slices = slices; this.stacks = stacks;
        this.initBuffers();
    }
    initBuffers() {
        this.vertices = []; this.normals = []; this.texCoords = []; this.indices = [];
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
}

class MyCylinder extends CGFobject {
    constructor(scene, slices = 8) {
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
            this.vertices.push(c, 0, s, c, 1, s);
            this.normals.push(c, 0, s, c, 0, s);
            this.texCoords.push(i / N, 0, i / N, 1);
        }
        for (let i = 0; i < N; i++) {
            const b = i * 2;
            this.indices.push(b, b+2, b+1, b+1, b+2, b+3);
        }
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

export class MyFlower extends CGFobject {
    constructor(scene, hue = 0.5, scale = 1.0) {
        super(scene);
        this.hue = hue;
        this.scale = scale;
        this.petalCount = 5 + Math.floor(Math.random() * 4);
        this.sphere = new MySphere(scene, 8, 8);
        this.cylinder = new MyCylinder(scene, 8);
        this._stemApp = null;
        this._petalApp = null;
        this._centerApp = null;
    }

    _hsvToRgb(h, s, v) {
        let r, g, b;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r=v; g=t; b=p; break;
            case 1: r=q; g=v; b=p; break;
            case 2: r=p; g=v; b=t; break;
            case 3: r=p; g=q; b=v; break;
            case 4: r=t; g=p; b=v; break;
            case 5: r=v; g=p; b=q; break;
        }
        return [r, g, b];
    }

    _getApp(r, g, b) {
        // Dynamically create a mini-appearance-like object that calls gl colours
        return { r, g, b };
    }

    display() {
        const sc = this.scene;
        const [pr, pg, pb] = this._hsvToRgb(this.hue, 0.85, 0.9);
        const s = this.scale;

        sc.pushMatrix();
        sc.scale(s, s, s);

        // Stem
        sc.pushMatrix();
        sc.translate(0, 0, 0);
        sc.scale(0.05, 1.0, 0.05);
        // Use current appearance (green-ish from scene)
        this.cylinder.display();
        sc.popMatrix();

        // Petals
        for (let i = 0; i < this.petalCount; i++) {
            const angle = (i / this.petalCount) * Math.PI * 2;
            sc.pushMatrix();
            sc.translate(0, 1.0, 0);
            sc.rotate(angle, 0, 1, 0);
            sc.translate(0.25, 0, 0);
            sc.scale(0.18, 0.08, 0.35);
            this.sphere.display();
            sc.popMatrix();
        }

        // Center
        sc.pushMatrix();
        sc.translate(0, 1.0, 0);
        sc.scale(0.2, 0.2, 0.2);
        this.sphere.display();
        sc.popMatrix();

        sc.popMatrix();
    }
}
