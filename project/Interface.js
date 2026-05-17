import { CGFinterface, dat } from '../lib/CGF.js';

export class Interface extends CGFinterface {
    constructor() {
        super();
    }

    init(application) {
        super.init(application);
        this.gui = new dat.GUI({ width: 260 });

        // Game Stats folder
        const statsFolder = this.gui.addFolder('Game Stats');
        statsFolder.add(this.scene, 'hp').name('Health Points').listen();
        statsFolder.add(this.scene, 'score').name('Score (s)').listen();
        statsFolder.add(this.scene, 'balesCarried').name('Bales Carried').listen();
        statsFolder.add(this.scene, 'balesDelivered').name('Total Delivered').listen();
        statsFolder.add(this.scene, 'lastDamage').name('Last Damage (HP)').listen();
        statsFolder.add(this.scene, 'lastHealed').name('Last Healed (HP)').listen();
        statsFolder.open();

        // Camera folder
        const camFolder = this.gui.addFolder('📷 Camera');
        camFolder.add(this.scene, 'followCamera').name('Follow Wagon').onChange(v => this.scene.onFollowCameraChanged(v));
        camFolder.open();

        // Debug folder
        const dbgFolder = this.gui.addFolder('🔧 Debug');
        dbgFolder.add(this.scene, 'showNormals').name('Show Normals').onChange(v => this.scene.onShowNormalsChanged(v));
        dbgFolder.add(this.scene, 'wireframe').name('Wireframe').onChange(v => this.scene.onWireframeChanged(v));

        return true;
    }
}
