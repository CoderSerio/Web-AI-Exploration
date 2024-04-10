import lec3d from "@trickle/lec3d";
import ReactDOM from "react-dom/client";
import { ReactElement } from "react";
import * as CANNON from "cannon-es";

import {
  AnimationMixer,
  LinearFilter,
  TextureLoader,
  Vector3,
  Object3D,
} from "three";

const config = {
  offset: 240,
  sizeUnit: 100,
  moveSpeed: 5 * 10,
  jumpMaxHeight: 40 * 18,
  animationSpeed: 0.01,
  jumpStatus: "STABLE", // 'STABLE' | 'UP' | 'DOWN',
  cameraPositions: [
    new Vector3(0, 0, 0),
    { x: -1788.5344006480404, y: 394.4747315215935, z: -1676.049381644657 },
  ],
  currentCameraPositionIndex: 0,
};

export const init = () => {
  const world = new CANNON.World();
  world.gravity.set(0, -9.8, 0); //单位：m/s²
  const bodyShape = new CANNON.Sphere(100000 * config.sizeUnit);
  const body = new CANNON.Body({
    mass: 0.3,
    position: new CANNON.Vec3(0, 100, 0),
    shape: bodyShape, //碰撞体的几何体形状
  });
  world.addBody(body);

  const lec = lec3d.init({
    axesHelperConfigs: {
      length: config.sizeUnit,
    },
    lightConfigs: {
      color: "#eee",
    },
    rendererConfigs: {
      backgroundColor: "#000",
    },
  });

  // 要不还是把这两个都放在lec上
  const css3d = lec3d.initCss3d({
    scene: lec.scene,
    camera: lec.camera,
  });

  const textureLoader = new TextureLoader();
  textureLoader.load("pics/universe_texture.jpg", (texture) => {
    texture.minFilter = LinearFilter;
    lec.scene.background = texture;
  });

  // TODO: controls的几个选项要禁用掉
  // TODO: 设置可以动态配置的旋转中心
  const controls = lec.addControls({});
  controls.enableZoom = false;
  controls.enablePan = false;

  lec.renderer.setPixelRatio(window.devicePixelRatio);
  lec.camera.far = 300 * config.sizeUnit;
  lec.camera.position.copy(config.cameraPositions[1]);
  lec.camera.updateProjectionMatrix();
  return { lec, css3d, controls };
};

export const loadModels = async (lec: any) => {
  const { model: land } = await lec3d.loadGLTF({
    modelPath: "3d/spaceship/scene.gltf",
    options: {
      scale: 20 * config.sizeUnit,
      position: {
        x: 3 * config.offset,
        y: -10,
        z: 2 * config.sizeUnit,
      },
    },
  });

  const { model: space } = await lec3d.loadGLTF({
    modelPath: "3d/planets/scene.gltf",
    options: {
      scale: 10 * config.sizeUnit,
      position: {
        x: 50 * config.offset + 10 * config.sizeUnit,
      },
      rotation: {
        y: lec3d.transferRotationValue(120),
      },
    },
  });

  // space.material.color.setHex(0xffffff);

  const { gltf, model: fox } = await lec3d.loadGLTF({
    modelPath: "3d/fox/fox.glb",
    options: {
      scale: 2 * config.sizeUnit,
      position: {
        x: 3 * config.offset,
        y: 0,
        z: 2 * config.sizeUnit,
      },
    },
  });

  lec.scene.add(land);
  lec.scene.add(fox);
  lec.scene.add(space);

  return gltf;
};

export const mixElement = (lec: any, css3d: any, jsx: ReactElement) => {
  const div = document.createElement("div");
  ReactDOM.createRoot(div).render(jsx);
  const css3dObj = css3d.createCss3dObject({ element: div });
  css3dObj.position.y = 1 * config.sizeUnit;
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

  const handleKeyPress = (e: KeyboardEvent) => {
    const key = e.key.toUpperCase() as keyof typeof activeKeys;
    // const model = wrappedModel.scene;
    activeKeys[key] = true;
    // console.log("res", wrappedModel, lec.camera.position);

    // 以 Z轴负方向 为正前方
    // const checkMove = () => {
    //   const moveVector = new Vector3();
    //   moveVector.y = 0;
    //   if (activeKeys["W"]) {
    //     moveVector.z = config.moveSpeed;
    //   }
    //   if (activeKeys["S"]) {
    //     moveVector.z = -config.moveSpeed;
    //   }
    //   if (activeKeys["A"]) {
    //     moveVector.x = config.moveSpeed;
    //   }
    //   if (activeKeys["D"]) {
    //     moveVector.x = -config.moveSpeed;
    //   }

    //   if (config.jumpStatus === "STABLE" && activeKeys[" "]) {
    //     config.jumpStatus = "UP";
    //   }
    //   if (config.jumpStatus === "UP") {
    //     if (model.position.y < config.jumpMaxHeight) {
    //       model.position.y += config.moveSpeed;
    //     } else {
    //       config.jumpStatus = "DOWN";
    //     }
    //   }
    //   if (config.jumpStatus === "DOWN") {
    //     if (model.position.y > 0) {
    //       model.position.y -= config.moveSpeed;
    //     } else {
    //       model.position.y = 0;
    //       config.jumpStatus = "STABLE";
    //     }
    //   }

    //   model.position.add(moveVector);
    //   const lookAtVector = new Vector3()
    //     .copy(moveVector)
    //     .multiplyScalar(10 * config.sizeUnit);
    //   lookAtVector.y = model.position.y;
    //   model.lookAt(lookAtVector);
    //   lec.camera.position.y = model.position.y + 3 * config.sizeUnit;
    //   lec.camera.position.x = model.position.x;
    //   lec.camera.position.z = model.position.z - 5 * config.sizeUnit;
    //   const cameraLookAtVector = new Vector3().copy(model.position);
    //   // cameraLookAtVector.y = 0;
    //   cameraLookAtVector.z = 0;
    //   lec.camera.lookAt(cameraLookAtVector);

    //   requestAnimationFrame(checkMove);
    // };
    // checkMove();

    // 永远以自己的前方为 w
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toUpperCase();
    activeKeys[key as keyof typeof activeKeys] = false;
    if (key === "C") {
      console.log("camera", lec.camera.position);
      console.log("character", lec.camera.position);
    } else if (key === "R") {
      const len = config.cameraPositions.length;
      config.currentCameraPositionIndex =
        (config.currentCameraPositionIndex + 1) % len;
      lec.camera.position.copy(
        config.cameraPositions[config.currentCameraPositionIndex]
      );
    }
  };

  const checkMove2 = () => {
    const model = wrappedModel.scene;
    const cameraDirection = new Vector3()
      .subVectors(model.position, lec.camera.position)
      .normalize();
    const baseMoveVector = new Vector3()
      .copy(cameraDirection)
      .multiplyScalar(config.moveSpeed);
    baseMoveVector.y = 0;
    const moveVector = new Vector3(0, 0, 0);

    if (activeKeys["W"]) {
      moveVector.add(baseMoveVector.clone().multiplyScalar(1));
    }
    if (activeKeys["S"]) {
      moveVector.add(baseMoveVector.clone().multiplyScalar(-1));
    }
    if (activeKeys["A"]) {
      const tempVector = baseMoveVector.clone();
      [tempVector.x, tempVector.z] = [baseMoveVector.z, -baseMoveVector.x];
      moveVector.add(tempVector);
    }
    if (activeKeys["D"]) {
      const tempVector = baseMoveVector.clone();
      [tempVector.x, tempVector.z] = [-baseMoveVector.z, baseMoveVector.x];
      moveVector.add(tempVector);
    }

    if (config.jumpStatus === "STABLE" && activeKeys[" "]) {
      config.jumpStatus = "UP";
    }
    if (config.jumpStatus === "UP") {
      if (model.position.y < config.jumpMaxHeight) {
        model.position.y += config.moveSpeed;
      } else {
        config.jumpStatus = "DOWN";
      }
    }
    if (config.jumpStatus === "DOWN") {
      if (model.position.y > 0) {
        model.position.y -= config.moveSpeed;
      } else {
        model.position.y = 0;
        config.jumpStatus = "STABLE";
      }
    }

    const isNoActiveKey = Object.keys(activeKeys).every((key) => {
      return !activeKeys[key as keyof typeof activeKeys];
    });

    if (!isNoActiveKey) {
      if (action.paused) {
        action.play();
      }
      action.paused = false;
      model.position.add(moveVector);
      if (config.currentCameraPositionIndex === 0) {
        lec.camera.position.add(moveVector.multiplyScalar(1));
      }

      const lookAtVector = new Vector3()
        .copy(moveVector)
        .multiplyScalar(100 * config.sizeUnit);
      model.lookAt(lookAtVector);
      const cameraLookAtVector = new Vector3().copy(model.position);
      cameraLookAtVector.y = 4 * config.sizeUnit;
      lec.camera.lookAt(cameraLookAtVector);
    } else {
      action.reset();
      action.paused = true;
    }

    config.cameraPositions[0].x = model.position.x;
    config.cameraPositions[0].y = model.position.y + 8 * config.sizeUnit;
    config.cameraPositions[0].z = model.position.z - 6 * config.sizeUnit;
    lec.camera.lookAt(model.position);

    requestAnimationFrame(checkMove2);
  };
  checkMove2();

  window.addEventListener("keypress", handleKeyPress, false);
  window.addEventListener("keyup", handleKeyUp, false);

  const unloadControl = () => {};

  return {
    keypress: [unloadControl],
    keyup: [handleKeyUp],
  };
};

const focus = (lec: any, model: any, Controls: any) => {
  lec.camera.lookAt(model.position);

  // Controls.target = model.position.clone();
  const controls = new Controls();

  const update = () => {
    controls.update(model.position);
    requestAnimationFrame(update);
  };
  update();
};

export const mount = (obj: any, element: HTMLElement) => {
  obj.mountTo(element);
};

export const start = async (
  lec: any,
  css3d: any,
  Controls: any,
  element: HTMLElement,
  videoCanvas: ReactElement
) => {
  const keyGLTF = await loadModels(lec);
  // mixElement(lec, css3d, videoCanvas);
  mount(lec, element);
  const unloadEventHandlers = controlModel(keyGLTF, lec);
  focus(lec, keyGLTF.scene, Controls);
  mount(css3d, element);

  const update = () => {
    requestAnimationFrame(update);
  };

  return unloadEventHandlers;
};
