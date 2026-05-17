import { CGFscene, CGFcamera, CGFaxis, CGFappearance, CGFshader, CGFtexture } from "../lib/CGF.js";
import { MyGrass } from './MyGrass.js';
import { MyTerrain} from './MyTerrain.js';


/**
 * MyScene
 * @constructor
 */
export class MyScene extends CGFscene {
  constructor() {
    super();
  }
  init(application) {
    super.init(application);

    this.initCameras();
    this.initLights();

    //Background color
    this.gl.clearColor(0.0, 0.2, 0.5, 0.7);

    this.gl.clearDepth(100.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.depthFunc(this.gl.LEQUAL);

    //Initialize scene objects
    this.axis = new CGFaxis(this);

    this.GrassTex  = new CGFtexture(this, "textures/grasstexture.jpg");
    this.DeadTex  = new CGFtexture(this, "textures/deadgrass.jpg");
    this.PathTex  = new CGFtexture(this, "textures/gravel.jpg");
    this.splatmap = new CGFtexture(this, "textures/splatmap.jpg");

    this.loadSplatmapData("textures/splatmap.jpg", (data, w, h) => {
        this.grass = new MyGrass(this, data, w, h);
    });
    this.grassShader = new CGFshader(this.gl, "shaders/grass.vert", "shaders/grass.frag");
    this.grassShader.setUniformsValues({
      timeFactor: 0,
      uSplatmap: 3
    });

    this.ground = new MyTerrain(this);
    
    this.groundShader = new CGFshader(this.gl, "shaders/ground.vert", "shaders/ground.frag");


    
    this.groundShader.setUniformsValues({
      uGrassTex:  0,
      uDeadTex:   1,
      uGravelTex: 2,
      uSplatmap:  3
    });

    //Objects connected to MyInterface
    this.displayAxis = true;
    this.scaleFactor = 1;

    this.setUpdatePeriod(16);

    
  }

  update(t) {
    // t é o tempo em milissegundos desde que a página abriu
    // Passamos para segundos (t/1000) e usamos o módulo para o número não crescer infinitamente
    this.grassShader.setUniformsValues({ 
        timeFactor: (t / 1000.0) % 1000.0 
    });
  }

  loadSplatmapData(url, callback) {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        callback(
            canvas.getContext('2d').getImageData(0, 0, img.width, img.height),
            img.width,
            img.height
        );
    };
    img.src = url;
}

  initLights() {
    this.lights[0].setPosition(15, 2, 5, 1);
    this.lights[0].setDiffuse(1.0, 1.0, 1.0, 1.0);
    this.lights[0].enable();
    this.lights[0].update();
  }
  initCameras() {
    this.camera = new CGFcamera(
      0.4,
      0.1,
      500,
      vec3.fromValues(15, 15, 15),
      vec3.fromValues(0, 0, 0)
    );
  }
  setDefaultAppearance() {
    this.setAmbient(0.1, 0.8, 0.2, 1.0);
    this.setDiffuse(0.1, 0.8, 0.2, 1.0);
    this.setSpecular(0.1, 0.8, 0.2, 1.0);
    this.setShininess(10.0);
  }
  display() {
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.updateProjectionMatrix();
    this.loadIdentity();
    this.applyViewMatrix();

    if (this.displayAxis) this.axis.display();

    this.setDefaultAppearance();

    // --- GRASS ---
    this.pushMatrix();
    this.gl.disable(this.gl.CULL_FACE);
    this.setActiveShader(this.grassShader);
    this.splatmap.bind(3);
    if (this.grass) this.grass.display();

    this.setActiveShader(this.defaultShader);
    this.gl.enable(this.gl.CULL_FACE);
    this.popMatrix();

    // --- GROUND ----
    this.pushMatrix();
    this.gl.disable(this.gl.CULL_FACE);
    this.setActiveShader(this.groundShader);

    // Bind the 4 textures using the correct names from init()
    this.GrassTex.bind(0);
    this.DeadTex.bind(1);
    this.PathTex.bind(2);
    this.splatmap.bind(3);

    this.ground.display();

    this.setActiveShader(this.defaultShader);
    this.gl.enable(this.gl.CULL_FACE);
    this.popMatrix();
  }
}
