import lec3d from "@trickle/lec3d";
import ReactDOM from "react-dom/client";
import { ReactElement } from "react";
import { AnimationMixer, Raycaster, Vector2, Vector3 } from "three";

const config = {
  moveSpeed: 10,
  jumpHeight: 50,
  animationSpeed: 0.02,
};

export const init = () => {
  const lec = lec3d.init({
    axesHelperConfigs: {
      length: 10000,
    },
    lightConfigs: {
      color: "orange",
    },
    rendererConfigs: {
      backgroundColor: "#ff3700",
      backgroundColorOpacity: 0.1,
    },
  });

  // 要不还是把这两个都放在lec上
  const css3d = lec3d.initCss3d({
    scene: lec.scene,
    camera: lec.camera,
  });

  const controls = lec.addControls();

  lec.renderer.setPixelRatio(window.devicePixelRatio);
  lec.camera.position.x = 1000;
  lec.camera.position.y = 300;
  lec.camera.position.z = 1000;
  lec.camera.lookAt(0, 10, 0);
  return { lec, css3d, controls };
};

export const loadModels = async (lec: any) => {
  const { model: land } = await lec3d.loadGLTF({
    modelPath: "3d/island/scene.gltf",
    options: {
      scale: 2,
    },
  });

  const { gltf, model: fox } = await lec3d.loadGLTF({
    modelPath: "3d/fox/fox.glb",
    options: {
      scale: 200,
    },
  });

  lec.scene.add(land);
  lec.scene.add(fox);

  return gltf;
};

export const mixElement = (lec: any, css3d: any, jsx: ReactElement) => {
  const div = document.createElement("div");
  ReactDOM.createRoot(div).render(jsx);
  const css3dObj = css3d.createCss3dObject({ element: div });
  css3dObj.position.y = 1000;
  lec.scene.add(css3dObj);
};

export const controlModel = (wrappedModel: any, lec: any) => {
  const activeKeys = {
    W: false,
    A: false,
    S: false,
    D: false,
    " ": false,
  };

  const mixer = new AnimationMixer(wrappedModel.scene);
  const action = mixer.clipAction(wrappedModel.animations[0]);
  action.clampWhenFinished = false; // 不要在动画结束时立即停止
  action.timeScale = 1;

  const playAnimation = () => {
    if (!action.paused) {
      action.play();
    }
    mixer.update(config.animationSpeed);
    requestAnimationFrame(playAnimation);
  };
  playAnimation();

  //

  const handleKeyPress = (e: KeyboardEvent) => {
    const key = e.key.toUpperCase() as keyof typeof activeKeys;
    const model = wrappedModel.scene;
    activeKeys[key] = true;
    console.log("res", wrappedModel, lec.camera.position);

    const moveVector = new Vector3();
    moveVector.y = 0;

    // 以 Z轴负方向 为正前方
    if (activeKeys["W"]) {
      moveVector.z = -config.moveSpeed;
    }
    if (activeKeys["S"]) {
      moveVector.z = config.moveSpeed;
    }
    if (activeKeys["A"]) {
      moveVector.x = -config.moveSpeed;
    }
    if (activeKeys["D"]) {
      moveVector.x = config.moveSpeed;
    }
    if (activeKeys[" "]) {
    }

    model.position.add(moveVector);
    const lookAtVector = new Vector3().copy(moveVector).multiplyScalar(1000);
    lec.camera.position.add(moveVector);
    lec.camera.lookAt(lookAtVector);
    model.lookAt(lookAtVector);
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toUpperCase() as keyof typeof activeKeys;
    activeKeys[key] = false;
  };

  window.addEventListener("keypress", handleKeyPress);
  window.addEventListener("keyup", handleKeyUp);

  const unloadControl = () => {};

  return {
    keypress: [unloadControl],
    keyup: [handleKeyUp],
  };
};

const focus = (lec: any, model: any, controls: any) => {
  controls.target = model.position.clone();
};

export const mount = (obj: any, element: HTMLElement) => {
  obj.mountTo(element);
};

export const start = async (
  lec: any,
  css3d: any,
  controls: any,
  element: HTMLElement,
  videoCanvas: ReactElement
) => {
  const keyGLTF = await loadModels(lec);
  mixElement(lec, css3d, videoCanvas);
  mount(lec, element);
  const unloadEventHandlers = controlModel(keyGLTF, lec);
  focus(lec, keyGLTF.scene, controls);
  mount(css3d, element);

  return unloadEventHandlers;
};
