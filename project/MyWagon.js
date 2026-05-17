import { CGFobject } from '../lib/CGF.js';

// ── Box ────────────────────────────────────────────────────────────────────
class MyBox extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }
    initBuffers() {
        this.vertices = [
            -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
            0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,
            -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
            0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5,
            -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
            -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
        ];
        this.normals = [
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
        ];
        this.texCoords = [];
        for (let i = 0; i < 6; i++) this.texCoords.push(0, 0, 1, 0, 1, 1, 0, 1);
        this.indices = [];
        for (let i = 0; i < 6; i++) {
            const b = i * 4;
            this.indices.push(b, b + 1, b + 2, b, b + 2, b + 3);
        }
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

// ── Torus ──────────────────────────────────────────────────────────────────
// Ring lies in the YZ plane  →  axle direction = X
// Spinning around X (rotate(spin, 1,0,0)) makes the wheel roll forward/back.
class MyTorus extends CGFobject {
    constructor(scene, inner = 0.2, outer = 1.0, sides = 10, loops = 24) {
        super(scene);
        this.inner = inner;
        this.outer = outer;
        this.sides = sides;
        this.loops = loops;
        this.initBuffers();
    }
    initBuffers() {
        this.vertices = []; this.normals = []; this.texCoords = []; this.indices = [];
        const r = this.inner, R = this.outer, S = this.sides, L = this.loops;

        for (let j = 0; j <= L; j++) {
            const phi = (j / L) * 2 * Math.PI;  // around the ring in YZ
            const cp = Math.cos(phi), sp = Math.sin(phi);

            for (let i = 0; i <= S; i++) {
                const theta = (i / S) * 2 * Math.PI; // around the tube
                const ct = Math.cos(theta), st = Math.sin(theta);

                // Ring centre sweeps in YZ; tube cross-section adds X and radial YZ
                const x = r * st;                  // tube in X  (axle direction)
                const y = (R + r * ct) * cp;         // ring in Y
                const z = (R + r * ct) * sp;         // ring in Z

                const nx = st;
                const ny = ct * cp;
                const nz = ct * sp;

                this.vertices.push(x, y, z);
                this.normals.push(nx, ny, nz);
                this.texCoords.push(i / S, j / L);
            }
        }

        for (let j = 0; j < L; j++) {
            for (let i = 0; i < S; i++) {
                const a = j * (S + 1) + i;
                const b = a + S + 1;
                this.indices.push(a, a + 1, b, a + 1, b + 1, b);
            }
        }
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

// ── Cylinder (Y axis, bottom at y=0, top at y=1, radius=1) ────────────────
class MyCylinder extends CGFobject {
    constructor(scene, slices = 12) {
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
            this.indices.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
        }
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

// ── MyWagon ────────────────────────────────────────────────────────────────
export class MyWagon extends CGFobject {
    constructor(scene) {
        super(scene);

        // World state
        this.posX = 0;
        this.posY = 0;     // set each frame by PrairieScene from terrain.height()
        this.posZ = -50;
        this.angle = 0;     // heading, radians. 0 = facing +Z (into scene)
        this.speed = 0;
        this.steerAngle = 0;
        this.wheelRot = 0;

        // Geometry
        this.box = new MyBox(scene);
        this.torus = new MyTorus(scene, 0.18, 1.0, 10, 24);
        this.cylinder = new MyCylinder(scene, 12);

        // Constants
        this.WHEEL_R = 1.5;   // visual radius after scale
        this.AXLE_HALF = 3.0;   // half-width of axle
        this.WHEELBASE = 10.0;  // front-to-rear axle distance
        this.MAX_SPEED = 0.08;
        this.ACCEL = 0.0001;
        this.BRAKE = 0.0006;
        this.DRAG = 0.00015;
        this.MAX_STEER = Math.PI / 5;
        this.STEER_RATE = 0.0018;
        this.STEER_RETURN = 0.003;

        this.pitch = 0; // Tilting forward/backward
        this.roll = 0;  // Tilting side-to-side
    }

    update(dt, keys) {
        // Steering: A=left(+), D=right(-)
        if (keys['a']) {
            this.steerAngle = Math.min(this.steerAngle + this.STEER_RATE * dt, this.MAX_STEER);
        } else if (keys['d']) {
            this.steerAngle = Math.max(this.steerAngle - this.STEER_RATE * dt, -this.MAX_STEER);
        } else {
            const ret = this.STEER_RETURN * dt;
            if (Math.abs(this.steerAngle) <= ret) this.steerAngle = 0;
            else this.steerAngle -= Math.sign(this.steerAngle) * ret;
        }

        // Speed
        if (keys['w']) {
            this.speed = Math.min(this.speed + this.ACCEL * dt, this.MAX_SPEED);
        } else if (keys['s']) {
            this.speed = Math.max(this.speed - this.BRAKE * dt, 0);
        } else {
            this.speed = Math.max(this.speed - this.DRAG * dt, 0);
        }

        // Heading (Ackermann): dAngle = speed*dt * tan(steer) / wheelbase
        if (this.speed > 0.0001) {
            this.angle += (this.speed * dt * Math.tan(this.steerAngle)) / this.WHEELBASE;
        }

        // Position: angle=0 → forward along +Z

        this.posX += Math.sin(this.angle) * this.speed * dt;
        this.posZ += Math.cos(this.angle) * this.speed * dt;

        // Boundary check
        const B = this.scene.mapSize / 2 - 25;
        this.posX = Math.max(-B, Math.min(B, this.posX));
        this.posZ = Math.max(-B, Math.min(B, this.posZ));

        const wheels = [
            { dx: -this.AXLE_HALF, dz: 3.5 },  // Front Left
            { dx: this.AXLE_HALF, dz: 3.5 },  // Front Right
            { dx: -this.AXLE_HALF, dz: -3.5 }, // Rear Left
            { dx: this.AXLE_HALF, dz: -3.5 }  // Rear Right
        ];

        let heights = [];
        for (let w of wheels) {
            // Rotate local wheel offset by wagon heading (this.angle)
            let worldX = this.posX + w.dx * Math.cos(this.angle) + w.dz * Math.sin(this.angle);
            let worldZ = this.posZ - w.dx * Math.sin(this.angle) + w.dz * Math.cos(this.angle);

            // Get height from terrain
            heights.push(this.scene.terrain.height(worldX, worldZ));
        }

        const [hFL, hFR, hRL, hRR] = heights;

        this.posY = (hFL + hFR + hRL + hRR) / 4;

        const frontH = (hFL + hFR) / 2;
        const rearH = (hRL + hRR) / 2;
        this.pitch = Math.atan2(rearH - frontH, 7.0);
        const leftH = (hFL + hRL) / 2;
        const rightH = (hFR + hRR) / 2;
        this.roll = Math.atan2(rightH - leftH, this.AXLE_HALF * 2);

        // Wheel spin
        this.wheelRot += (this.speed * dt) / this.WHEEL_R;
    }

    display(bodyApp, wheelApp, coverApp, baleApp) {
        const sc = this.scene;

        sc.pushMatrix();
        sc.translate(this.posX, this.posY + 2, this.posZ);
        sc.rotate(this.angle, 0, 1, 0); // Heading
        sc.rotate(this.pitch, 1, 0, 0); // Pitch (tilt forward/back)
        sc.rotate(this.roll, 0, 0, 1);  // Roll (tilt left/right)

        // ── Bed ──────────────────────────────────────────────────────────
        bodyApp.apply();
        sc.pushMatrix();
        sc.scale(5, 1.2, 10);
        this.box.display();
        sc.popMatrix();

        // ── Tongue (forward = +Z) ─────────────────────────────────────────
        bodyApp.apply();
        sc.pushMatrix();
        sc.translate(0, -0.3, 7.5);
        sc.scale(0.5, 0.4, 5);
        this.box.display();
        sc.popMatrix();

        // ── Cover: rear half (rear = -Z) ──────────────────────────────────
        coverApp.apply();
        for (const sx of [-2.4, 2.4]) {
            sc.pushMatrix();
            sc.translate(sx, 1.8, -1.5);
            sc.scale(0.25, 3.0, 0.25);
            this.box.display();
            sc.popMatrix();
        }
        sc.pushMatrix();
        sc.translate(0, 3.3, -1.5);
        sc.scale(5.2, 0.25, 5.5);
        this.box.display();
        sc.popMatrix();
        sc.pushMatrix();
        sc.translate(0, 1.8, -4.3);
        sc.scale(5.2, 3.0, 0.25);
        this.box.display();
        sc.popMatrix();

        // ── Rear wheels (z = -3.5, no steering) ──────────────────────────
        wheelApp.apply();
        this._drawWheel(sc, -this.AXLE_HALF, -0.4, -3.5, this.wheelRot);
        this._drawWheel(sc, this.AXLE_HALF, -0.4, -3.5, this.wheelRot);

        // ── Front axle group (z = +3.5, steered) ─────────────────────────
        // Translate to axle centre, steer-rotate around Y, then draw wheels left/right
        sc.pushMatrix();
        sc.translate(0, -0.4, 3.5);          // front axle centre in wagon space
        sc.rotate(this.steerAngle, 0, 1, 0); // steering pivot
        this._drawWheelLocal(sc, -this.AXLE_HALF, 0, 0, this.wheelRot);
        this._drawWheelLocal(sc, this.AXLE_HALF, 0, 0, this.wheelRot);
        sc.popMatrix();

        // ── Axle rods ─────────────────────────────────────────────────────
        bodyApp.apply();
        this._drawAxle(sc, -3.5);
        this._drawAxle(sc, 3.5);

        // ── Bales ─────────────────────────────────────────────────────────
        if (this.scene.balesCarried > 0) {
            baleApp.apply();
            sc.pushMatrix();
            sc.translate(-1.0, 1.2, -1.5);
            sc.scale(1.8, 1.8, 1.8);
            this.box.display();
            sc.popMatrix();
        }
        if (this.scene.balesCarried > 1) {
            baleApp.apply();
            sc.pushMatrix();
            sc.translate(1.0, 1.2, -1.5);
            sc.scale(1.8, 1.8, 1.8);
            this.box.display();
            sc.popMatrix();
        }

        sc.popMatrix();
    }

    // Draw one wheel at (ox, oy, oz) relative to wagon origin
    _drawWheel(sc, ox, oy, oz, spin) {
        sc.pushMatrix();
        sc.translate(ox, oy, oz);
        this._wheelGeom(sc, spin);
        sc.popMatrix();
    }

    // Draw one wheel at (ox, oy, oz) relative to the CURRENT matrix (front-axle group)
    _drawWheelLocal(sc, ox, oy, oz, spin) {
        sc.pushMatrix();
        sc.translate(ox, oy, oz);
        this._wheelGeom(sc, spin);
        sc.popMatrix();
    }

    // The torus ring is already in the YZ plane (axle = X).
    // Spin around X = forward/back roll. No extra orientation rotation needed.
    _wheelGeom(sc, spin) {
        sc.pushMatrix();
        sc.rotate(spin, 1, 0, 0);                           // roll around X
        sc.scale(this.WHEEL_R, this.WHEEL_R, this.WHEEL_R); // scale to desired size
        this.torus.display();
        sc.popMatrix();

        // Hub: cylinder along X, centred at wheel
        sc.pushMatrix();
        sc.translate(-0.15, 0, 0);
        sc.rotate(-Math.PI / 2, 0, 0, 1);  // cylinder Y → X
        sc.scale(0.2, 0.3, 0.2);
        this.cylinder.display();
        sc.popMatrix();
    }

    // Thin rod spanning full axle width, at z = oz in wagon space
    _drawAxle(sc, oz) {
        sc.pushMatrix();
        sc.translate(-this.AXLE_HALF, -0.4, oz);
        sc.rotate(-Math.PI / 2, 0, 0, 1);  // cylinder Y → X
        sc.scale(0.15, this.AXLE_HALF * 2, 0.15);
        this.cylinder.display();
        sc.popMatrix();
    }
}
