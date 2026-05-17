import { CGFapplication } from '../lib/CGF.js';
import { Scene } from './Scene.js';
import { Interface } from './Interface.js';

function main() {
    const app = new CGFapplication(document.body);
    const myScene = new Scene();
    const myInterface = new Interface();

    app.init();
    app.setScene(myScene);
    app.setInterface(myInterface);

    myInterface.setActiveCamera(myScene.camera);

    app.run();
}

main();
