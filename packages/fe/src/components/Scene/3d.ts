import lec3d from "@trickle/lec3d";
import { ReactElement } from "react";
import ReactDOM from "react-dom/client";

import { AnimationMixer, LinearFilter, TextureLoader, Vector3 } from "three";
import { calculateDistance, config, mount, focus } from "./utils";

export const init = () => {
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
  lec.renderer.setPixelRatio(window.devicePixelRatio);
  lec.camera.far = 300 * config.sizeUnit;
  lec.camera.position.copy(config.cameraPositions[1]);
  lec.camera.updateProjectionMatrix();
  return { lec, css3d };
};

export const loadModels = async (lec: any, css3d: any) => {
  const { gltf, model: fox } = await lec3d.loadGLTF({
    modelPath: "3d/fox/fox.glb",
    options: {
      scale: 2 * config.sizeUnit,
      position: {
        y: 0,
      },
    },
  });

  const { gltf: spaceShipGLTF, model: land } = await lec3d.loadGLTF({
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

  const { gltf: computerGLTF, model: computer } = await lec3d.loadGLTF({
    modelPath: "3d/old_computer/scene.gltf",
    options: {
      scale: 3 * config.sizeUnit,
      position: {
        x: 30 * config.sizeUnit,
        z: 1 * config.sizeUnit,
      },
      rotation: {
        y: lec3d.transferRotationValue("-90"),
      },
    },
  });

  lec.scene.add(land);
  lec.scene.add(fox);
  lec.scene.add(computer);

  return [gltf, spaceShipGLTF, computerGLTF];
};

export const mixElement = (
  lec: any,
  css3d: any,
  jsx: ReactElement,
  vector = { x: 0, y: 0, z: 0 },
  rotation = "-100"
) => {
  // const textDiv = document.createElement("div");
  // textDiv.innerHTML =
  //   '<div style="font-size:32px;color:white;"}>基于 Web 的人脸识别</div>';
  // const css3dTextDiv = css3d.createCss3dObject({ element: textDiv });
  // const vector = new Vector3(config.cameraPositions[2] as any);
  // lec.scene.add(css3dTextDiv);
  const div = document.createElement("div");
  // css3dTextDiv.rotation.y = lec3d.transferRotationValue("-90");
  ReactDOM.createRoot(div).render(jsx);
  const css3dDiv = css3d.createCss3dObject({ element: div });
  css3dDiv.position.copy(vector);
  css3dDiv.rotation.y = lec3d.transferRotationValue(rotation);
  lec.scene.add(css3dDiv);

  const remove = () => {
    lec.scene.remove(css3dDiv);
  };
  return remove;
};

export const controlModel = (
  wrappedModel: any,
  lec: any,
  css3d: any,
  setIsWaiting: () => void,
  videoCanvas: JSX.Element,
  windowComponent: JSX.Element
) => {
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
    activeKeys[key] = true;
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toUpperCase();
    activeKeys[key as keyof typeof activeKeys] = false;
    if (key === "C") {
      console.log("camera", lec.camera.position);
      console.log("character", wrappedModel.scene.position);
    } else if (key === "R") {
      const len = config.cameraPositions.length;
      config.currentCameraPositionIndex =
        (config.currentCameraPositionIndex + 1) % len;
      lec.camera.position.copy(
        config.cameraPositions[config.currentCameraPositionIndex]
      );
    }
  };

  const handleClick = (e: MouseEvent) => {
    if (!config.systemInit) return;
    const targets = lec.getClickEventTargets(e);
    if (targets[0]?.object?.name === "Cube003_Screen_0") {
      targets[0].object.material.color.setHex(0x0000ff);
      // TODO:
    }
  };

  const checkMove2 = () => {
    if (!config.systemInit) {
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

        if (config.cameraPositions[2])
          if (config.currentCameraPositionIndex === 0) {
            lec.camera.position.add(moveVector.multiplyScalar(1));
          }

        const lookAtVector = new Vector3()
          .copy(moveVector)
          .multiplyScalar(100 * config.sizeUnit);
        model.lookAt(lookAtVector);
        const cameraLookAtVector = new Vector3().copy(model.position);
        cameraLookAtVector.y = 4 * config.sizeUnit;
      } else {
        action.reset();
        action.paused = true;
      }

      const dis = calculateDistance(
        model.position,
        config.cameraPositions[2] as Vector3
      );
      let remove = () => {
        console.error("remove 尚未初始化");
      };
      if (dis < 300 && !config.canvasLoaded) {
        const vec3 = new Vector3(
          31 * config.sizeUnit,
          4 * config.sizeUnit,
          1 * config.sizeUnit
        );

        remove = mixElement(lec, css3d, windowComponent, vec3);
        config.canvasLoaded = true;
      } else if (config.canvasLoaded && remove) {
        remove?.();
        // config.canvasLoaded = false;
      }

      config.cameraPositions[0].x = model.position.x;
      config.cameraPositions[0].y = model.position.y + 8 * config.sizeUnit;
      config.cameraPositions[0].z = model.position.z - 6 * config.sizeUnit;

      if (!config.systemInit) {
        lec.camera.lookAt(model.position);
      }
    }
    requestAnimationFrame(checkMove2);
  };
  checkMove2();

  window.addEventListener("keypress", handleKeyPress, false);
  window.addEventListener("keyup", handleKeyUp, false);
  window.addEventListener("click", handleClick, false);

  return {
    // keypress: [unloadControl],
    keyup: [handleKeyUp],
  };
};

export const start = async (
  lec: any,
  css3d: any,
  controls: any,
  element: HTMLElement,
  setIsWaiting: () => void,
  videoCanvas: ReactElement,
  windowComponent: ReactElement
) => {
  const [keyGLTF, spaceShipGLTF, computerGLTF] = await loadModels(lec, css3d);
  // mixElement(lec, css3d, videoCanvas);
  mount(lec, element);
  const unloadEventHandlers = controlModel(
    keyGLTF,
    lec,
    css3d,
    setIsWaiting,
    videoCanvas,
    windowComponent
  );
  focus(lec, keyGLTF.scene, controls);
  mount(css3d, element);

  return unloadEventHandlers;
};
