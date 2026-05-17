import {
    CGFscene, CGFcamera, CGFaxis, CGFappearance, CGFtexture, CGFshader
} from '../lib/CGF.js';
import { MyTerrain } from './MyTerrain.js';
import { MySkySphere } from './MySkySphere.js';
import { MyWagon } from './MyWagon.js';
import { MyBarn } from './MyBarn.js';
import { MyHayBale } from './MyHayBale.js';
import { MyRock } from './MyRock.js';
import { MyGrass } from './MyGrass.js';
import { MyFlower } from './MyFlower.js';
import { MyArrow } from './MyArrow.js';
import { MySun } from './MySun.js';

export class Scene extends CGFscene {
    constructor() {
        super();

        // ── Game state ──────────────────────────────────────────────────
        this.hp = 100;
        this.maxHp = 100;
        this.score = 0;
        this.balesCarried = 0;
        this.maxBales = 2;
        this.balesDelivered = 0;
        this.lastDamage = 0;
        this.lastHealed = 0;
        this.gameOver = false;

        // ── Interface-exposed flags ─────────────────────────────────────
        this.followCamera = true;
        this.showNormals = false;
        this.wireframe = false;

        // ── Internal timers / state ─────────────────────────────────────
        this._gameStartTime = null;
        this._lastUpdate = 0;

        // ── Bales ───────────────────────────────────────────────────────
        this._numBales = 5;
        this._hayBalePositions = [];
        this._hayBaleVisible = [];
        this._hayBaleCollected = [];
        this._hayBaleObjects = [];

        // ── Barn delivery area ──────────────────────────────────────────
        this._barnPos = { x: 0, z: -60 };
        this._barnCircleRadius = 12;
        this._wagonInBarnCircle = false;

        // ── Shader time uniform ─────────────────────────────────────────
        this._shaderTime = 0;

        this.mapSize = 400
    }

    // ════════════════════════════════════════════════════════════════════
    // init
    // ════════════════════════════════════════════════════════════════════
    init(application) {
        super.init(application);
        this.initCameras();
        this.initLights();

        const gl = this.gl;
        gl.clearColor(0.53, 0.81, 0.98, 1.0);
        gl.clearDepth(1000.0);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.enableTextures(true);
        this.axis = new CGFaxis(this, 5);

        // ── Geometry ────────────────────────────────────────────────────
        this.terrain = new MyTerrain(this, this.mapSize, 50);
        this.sky = new MySkySphere(this, 600);
        this.wagon = new MyWagon(this);
        this.barn = new MyBarn(this);
        this.sun = new MySun(this);

        this._generateHayBales();
        this._generateRocks();
        this._generateGrass();
        this._generateFlowers();

        this.arrow = new MyArrow(this);

        // ── Shaders ─────────────────────────────────────────────────────
        // CGFshader loads files synchronously (XHR with async=false in CGF).
        // We still guard with a flag so display() won't crash if compilation fails.
        this._grassShaderOk = false;
        this._arrowShaderOk = false;

        try {
            this.grassShader = new CGFshader(
                this.gl,
                'shaders/grass.vert',
                'shaders/grass.frag'
            );
            this.grassShader.setUniformsValues({ timeFactor: 0 });
            this._grassShaderOk = true;
        } catch (e) {
            console.warn('Grass shader failed to compile:', e);
        }

        try {
            this.arrowShader = new CGFshader(
                this.gl,
                'shaders/arrow.vert',
                'shaders/arrow.frag'
            );
            this.arrowShader.setUniformsValues({ timeFactor: 0 });
            this._arrowShaderOk = true;
        } catch (e) {
            console.warn('Arrow shader failed to compile:', e);
        }

        // ── Materials ───────────────────────────────────────────────────
        this._initMaterials();

        // ── Keyboard ────────────────────────────────────────────────────
        this._keys = {};
        document.addEventListener('keydown', e => {
            this._keys[e.key.toLowerCase()] = true;
            this._onKeyDown(e.key.toLowerCase());
        });
        document.addEventListener('keyup', e => {
            this._keys[e.key.toLowerCase()] = false;
        });

        this.setUpdatePeriod(16);
    }

    // ════════════════════════════════════════════════════════════════════
    // Materials
    // ════════════════════════════════════════════════════════════════════
    _initMaterials() {
        const mk = (a, d, s, sh) => {
            const ap = new CGFappearance(this);
            ap.setAmbient(...a);
            ap.setDiffuse(...d);
            ap.setSpecular(...s);
            ap.setShininess(sh);
            return ap;
        };

        this.terrainApp = mk([0.40, 0.35, 0.20, 1], [0.60, 0.55, 0.30, 1], [0.05, 0.05, 0.05, 1], 5);
        this.wagonApp = mk([0.40, 0.25, 0.10, 1], [0.60, 0.40, 0.15, 1], [0.05, 0.05, 0.05, 1], 10);
        this.wheelApp = mk([0.20, 0.15, 0.05, 1], [0.35, 0.25, 0.10, 1], [0.05, 0.05, 0.05, 1], 5);
        this.coverApp = mk([0.90, 0.88, 0.80, 1], [0.95, 0.93, 0.85, 1], [0.05, 0.05, 0.05, 1], 5);
        this.baleApp = mk([0.50, 0.45, 0.10, 1], [0.80, 0.72, 0.25, 1], [0.05, 0.05, 0.05, 1], 5);
        this.rockApp = mk([0.25, 0.25, 0.25, 1], [0.45, 0.42, 0.38, 1], [0.10, 0.10, 0.10, 1], 20);
        this.grassApp = mk([0.15, 0.40, 0.08, 1], [0.25, 0.55, 0.12, 1], [0.02, 0.05, 0.02, 1], 3);
        this.flowerApp = mk([0.50, 0.10, 0.40, 1], [0.80, 0.20, 0.60, 1], [0.05, 0.05, 0.05, 1], 5);
        this.skyApp = mk([0.30, 0.55, 0.85, 1], [0.53, 0.81, 0.98, 1], [0.00, 0.00, 0.00, 1], 1);
        this.sunApp = mk([1.00, 0.95, 0.30, 1], [1.00, 0.95, 0.30, 1], [0.50, 0.50, 0.10, 1], 80);
        this.arrowApp = mk([0.80, 0.60, 0.00, 1], [1.00, 0.85, 0.00, 1], [0.10, 0.10, 0.00, 1], 10);
    }

    // ════════════════════════════════════════════════════════════════════
    // Cameras & Lights
    // ════════════════════════════════════════════════════════════════════
    initCameras() {
        this.camera = new CGFcamera(
            0.6, 0.1, 1000,
            vec3.fromValues(0, 30, 60),
            vec3.fromValues(0, 0, 0)
        );
    }

    initLights() {
        this.lights[0].setPosition(100, 200, 100, 1);
        this.lights[0].setAmbient(0.30, 0.28, 0.22, 1);
        this.lights[0].setDiffuse(1.00, 0.95, 0.80, 1);
        this.lights[0].setSpecular(0.50, 0.50, 0.40, 1);
        this.lights[0].enable();
        this.lights[0].update();

        this.lights[1].setPosition(-50, 80, -50, 1);
        this.lights[1].setAmbient(0.05, 0.05, 0.10, 1);
        this.lights[1].setDiffuse(0.25, 0.30, 0.40, 1);
        this.lights[1].setSpecular(0.00, 0.00, 0.00, 1);
        this.lights[1].enable();
        this.lights[1].update();
    }

    // ════════════════════════════════════════════════════════════════════
    // Hay-bale & Rocks & Grass & Flowers generation
    // ════════════════════════════════════════════════════════════════════
    _generateHayBales() {
        for (let i = 0; i < this._numBales; i++) {
            let x, z;
            do {
                x = (Math.random() - 0.5) * (this.mapSize * 0.6);
                z = (Math.random() - 0.5) * (this.mapSize * 0.6);
            } while (Math.hypot(x, z) < 20);
            this._hayBalePositions.push({ x, z });
            this._hayBaleVisible.push(false);
            this._hayBaleCollected.push(false);
            this._hayBaleObjects.push(new MyHayBale(this));
        }
    }

    _generateRocks() {
        this._rockData = [];
        this._rockObjects = [];
        for (let i = 0; i < 12; i++) {
            let x, z;
            do {
                x = (Math.random() - 0.5) * (this.mapSize * 0.7);
                z = (Math.random() - 0.5) * (this.mapSize * 0.7);
            } while (Math.hypot(x, z) < 25);
            const scale = 1.0 + Math.random() * 2.0;
            const rot = Math.random() * Math.PI * 2;
            this._rockData.push({ x, z, scale, rot });
            this._rockObjects.push(new MyRock(this));
        }
    }

    _generateGrass() {
        // Grass patches
        this._grassPatches = [];
        for (let i = 0; i < 60; i++) {
            const x = (Math.random() - 0.5) * (this.mapSize * 0.7);
            const z = (Math.random() - 0.5) * (this.mapSize * 0.7);
            if (Math.abs(x) < 22 && Math.abs(z) < 22) continue;
            this._grassPatches.push({ x, z, grass: new MyGrass(this) });
        }
    }

    _generateFlowers() {
        // Flowers
        this._flowers = [];
        for (let i = 0; i < 40; i++) {
            const x = (Math.random() - 0.5) * (this.mapSize * 0.7);
            const z = (Math.random() - 0.5) * (this.mapSize * 0.7);
            const scale = 0.5 + Math.random() * 1.2;
            const hue = Math.random();
            this._flowers.push({ x, z, flower: new MyFlower(this, hue, scale) });
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // Key handlers
    // ════════════════════════════════════════════════════════════════════
    _onKeyDown(key) {
        if (key === 'p') this._tryPickBale();
        if (key === 'l') this._tryDropBale();
    }

    _tryPickBale() {
        if (this.balesCarried >= this.maxBales) return;
        const wx = this.wagon.posX, wz = this.wagon.posZ;
        for (let i = 0; i < this._hayBalePositions.length; i++) {
            if (this._hayBaleCollected[i]) continue;
            const { x, z } = this._hayBalePositions[i];
            if (Math.hypot(wx - x, wz - z) < 10) {
                this._hayBaleCollected[i] = true;
                this.balesCarried++;
                this._updateHUD();
                break;
            }
        }
    }

    _tryDropBale() {
        if (this.balesCarried === 0) return;
        const wx = this.wagon.posX, wz = this.wagon.posZ;
        const { x: bx, z: bz } = this._barnPos;
        const distToBarn = Math.hypot(wx - bx, wz - bz);

        if (distToBarn < this._barnCircleRadius + 4) {
            const gain = this.balesCarried * 50;
            this.hp = Math.min(this.maxHp, this.hp + gain);
            this.lastHealed = gain;
            this.balesDelivered += this.balesCarried;
            this.balesCarried = 0;
            this._showFlash('rgba(0,255,100,0.25)');
            this._respawnCollectedBales();
        } else {
            this.balesCarried = 0;
        }
        this._updateHUD();
    }

    _respawnCollectedBales() {
        for (let i = 0; i < this._hayBaleCollected.length; i++) {
            if (!this._hayBaleCollected[i]) continue;
            let x, z;
            do {
                x = (Math.random() - 0.5) * 140;
                z = (Math.random() - 0.5) * 140;
            } while (Math.hypot(x, z) < 20);
            this._hayBalePositions[i] = { x, z };
            this._hayBaleCollected[i] = false;
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // Collisions
    // ════════════════════════════════════════════════════════════════════
    _checkCollisions() {
        const wx = this.wagon.posX, wz = this.wagon.posZ;

        // Rocks
        for (let i = 0; i < this._rockData.length; i++) {
            const { x, z, scale } = this._rockData[i];
            if (Math.hypot(wx - x, wz - z) < scale * 2.5) {
                const dmg = Math.floor(5 + Math.random() * 10);
                this.hp -= dmg;
                this.lastDamage = dmg;
                this.wagon.speed = -this.wagon.speed * 0.5;
                this._showFlash('rgba(255,0,0,0.3)');
                this._updateHUD();
                break;
            }
        }

        // Bale visibility (reveal within 35 units)
        for (let i = 0; i < this._hayBalePositions.length; i++) {
            if (this._hayBaleCollected[i]) { this._hayBaleVisible[i] = false; continue; }
            const { x, z } = this._hayBalePositions[i];
            this._hayBaleVisible[i] = Math.hypot(wx - x, wz - z) < 35;
        }

        // Barn circle
        const { x: bx, z: bz } = this._barnPos;
        this._wagonInBarnCircle = Math.hypot(wx - bx, wz - bz) < this._barnCircleRadius + 4;
    }

    // ════════════════════════════════════════════════════════════════════
    // HUD helpers
    // ════════════════════════════════════════════════════════════════════
    _showFlash(color) {
        const el = document.getElementById('flash');
        if (!el) return;
        el.style.background = color;
        el.style.opacity = '1';
        setTimeout(() => { el.style.opacity = '0'; }, 150);
    }

    _updateHUD() {
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        const bar = document.getElementById('hp-bar');
        if (bar) bar.style.width = Math.max(0, Math.min(100, this.hp / this.maxHp * 100)) + '%';
        set('hud-hp', Math.max(0, Math.round(this.hp)));
        set('hud-score', Math.round(this.score) + 's');
        set('hud-bales', this.balesCarried + '/' + this.maxBales);
        set('hud-delivered', this.balesDelivered);
        set('hud-damage', this.lastDamage);
        set('hud-healed', this.lastHealed);
    }

    _triggerGameOver() {
        this.gameOver = true;
        const go = document.getElementById('game-over');
        if (go) go.style.display = 'flex';
        const fs = document.getElementById('final-score');
        if (fs) fs.textContent = Math.round(this.score);
        const fb = document.getElementById('final-bales');
        if (fb) fb.textContent = this.balesDelivered;
    }

    // ════════════════════════════════════════════════════════════════════
    // Interface callbacks
    // ════════════════════════════════════════════════════════════════════
    onFollowCameraChanged(v) { this.followCamera = v; }
    onShowNormalsChanged(v) { this.showNormals = v; }
    onWireframeChanged(v) { this.wireframe = v; }

    // ════════════════════════════════════════════════════════════════════
    // update  (called every ~16 ms)
    // ════════════════════════════════════════════════════════════════════
    update(t) {
        if (this.gameOver) return;

        const dt = this._lastUpdate === 0 ? 0 : (t - this._lastUpdate);
        this._lastUpdate = t;

        if (this._gameStartTime === null) this._gameStartTime = t;
        this.score = (t - this._gameStartTime) / 1000;

        // HP drain 1 HP/sec
        this.hp -= dt / 1000;
        if (this.hp <= 0) {
            this.hp = 0;
            this._triggerGameOver();
            this._updateHUD();
            return;
        }

        this.wagon.update(dt, this._keys);
        // Snap wagon Y to terrain surface
        this.wagon.posY = this.terrain.height(this.wagon.posX, this.wagon.posZ);
        this._checkCollisions();

        // Shader time (loops 0-100)
        this._shaderTime = (t / 100) % 100;
        if (this._grassShaderOk)
            this.grassShader.setUniformsValues({ timeFactor: this._shaderTime });
        if (this._arrowShaderOk)
            this.arrowShader.setUniformsValues({ timeFactor: this._shaderTime });

        this._updateHUD();

        // Follow camera
        if (this.followCamera) {
            const wx = this.wagon.posX, wz = this.wagon.posZ;
            const wy = this.wagon.posY;
            const a = this.wagon.angle;
            const cx = wx - Math.sin(a) * 40;
            const cz = wz - Math.cos(a) * 40;
            this.camera.setPosition(vec3.fromValues(cx, wy + 18, cz));
            this.camera.setTarget(vec3.fromValues(wx, wy + 3, wz));
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // display
    // ════════════════════════════════════════════════════════════════════
    display() {
        const gl = this.gl;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.updateProjectionMatrix();
        this.loadIdentity();
        this.applyViewMatrix();

        this.lights[0].update();
        this.lights[1].update();

        // ── Sky ──────────────────────────────────────────────────────────
        this.setActiveShader(this.defaultShader);
        this.skyApp.apply();
        this.sky.display();

        // ── Terrain ──────────────────────────────────────────────────────
        this.terrainApp.apply();
        this.terrain.display();

        // ── Barn ─────────────────────────────────────────────────────────
        // (MyBarn manages its own appearances internally)
        this.barn.display(this._barnPos.x, this._barnPos.z, this._wagonInBarnCircle);


        // ── Rocks ────────────────────────────────────────────────────────
        this.rockApp.apply();
        for (let i = 0; i < this._rockData.length; i++) {
            const { x, z, scale, rot } = this._rockData[i];
            this.pushMatrix();
            this.translate(x, 0, z);
            this.rotate(rot, 0, 1, 0);
            this.scale(scale, scale, scale);
            this._rockObjects[i].display();
            this.popMatrix();
        }

        // ── Hay bales + arrows ───────────────────────────────────────────
        for (let i = 0; i < this._hayBalePositions.length; i++) {
            if (this._hayBaleCollected[i]) continue;
            const { x, z } = this._hayBalePositions[i];
            const by = this.terrain.height(x, z);

            // Arrow (always shown, sits on terrain)
            if (this._arrowShaderOk) {
                this.setActiveShader(this.arrowShader);
            } else {
                this.setActiveShader(this.defaultShader);
                this.arrowApp.apply();
            }
            this.pushMatrix();
            this.translate(x, by, z);
            this.arrow.display();
            this.popMatrix();

            // Bale (only when nearby) - sits on terrain surface
            if (this._hayBaleVisible[i]) {
                this.setActiveShader(this.defaultShader);
                this.baleApp.apply();
                this.pushMatrix();
                this.translate(x, by + 1.5, z);
                this._hayBaleObjects[i].display();
                this.popMatrix();
            }
        }

        // ── Grass ────────────────────────────────────────────────────────
        if (this._grassShaderOk) {
            this.setActiveShader(this.grassShader);
        } else {
            this.setActiveShader(this.defaultShader);
            this.grassApp.apply();
        }
        gl.disable(gl.CULL_FACE);
        for (const gp of this._grassPatches) {
            this.pushMatrix();
            this.translate(gp.x, this.terrain.height(gp.x, gp.z), gp.z);
            gp.grass.display();
            this.popMatrix();
        }
        gl.enable(gl.CULL_FACE);

        // ── Flowers ──────────────────────────────────────────────────────
        this.setActiveShader(this.defaultShader);
        this.flowerApp.apply();
        for (const fp of this._flowers) {
            this.pushMatrix();
            this.translate(fp.x, this.terrain.height(fp.x, fp.z), fp.z);
            fp.flower.display();
            this.popMatrix();
        }

        // ── Sun ──────────────────────────────────────────────────────────
        this.sunApp.apply();
        this.pushMatrix();
        this.translate(80, 120, -80);
        this.scale(12, 12, 12);
        this.sun.display();
        this.popMatrix();

        // ── Wagon ────────────────────────────────────────────────────────
        this.setActiveShader(this.defaultShader);
        this.wagon.display(this.wagonApp, this.wheelApp, this.coverApp, this.baleApp);
    }
}
