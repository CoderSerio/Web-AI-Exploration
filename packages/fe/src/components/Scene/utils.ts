import lec3d from "@trickle/lec3d";
import ReactDOM from "react-dom/client";
import { ReactElement } from "react";
import * as CANNON from "cannon-es";
import * as TWEEN from "@tweenjs/tween.js";

import {
  AnimationMixer,
  LinearFilter,
  TextureLoader,
  Vector3,
  Object3D,
  Clock,
  PointsMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  MeshLambertMaterial,
  SphereGeometry,
  Mesh,
} from "three";
import { model } from "@tensorflow/tfjs";

const config = {
  offset: 240,
  sizeUnit: 100,
  moveSpeed: 5 * 10,
  jumpMaxHeight: 40 * 18,
  animationSpeed: 0.01,
  jumpStatus: "STABLE", // 'STABLE' | 'UP' | 'DOWN',
  cameraPositions: [
    new Vector3(0, 0, 0),
    { x: -1780, y: 400, z: 0 },
    { x: 2500, y: 600, z: 120 },
    // { x: -1700, y: 400, z: 0 },
  ],
  currentCameraPositionIndex: 0,
  systemInit: false,
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
  // const controls = lec.addControls({});
  // controls.enableZoom = false;
  // controls.enablePan = false;

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

export const mixElement = (lec: any, css3d: any, jsx: ReactElement) => {
  const textDiv = document.createElement("div");
  textDiv.innerHTML =
    '<div style="font-size:32px;color:white;"}>基于 Web 的人脸识别</div>';
  const css3dTextDiv = css3d.createCss3dObject({ element: textDiv });
  const vector = new Vector3(config.cameraPositions[2] as any);

  css3dTextDiv.rotation.y = lec3d.transferRotationValue("-90");
  lec.scene.add(css3dTextDiv);

  const div = document.createElement("div");
  ReactDOM.createRoot(div).render(jsx);
  const css3dDiv = css3d.createCss3dObject({ element: div });
  css3dDiv.position.copy(vector);
  lec.scene.add(css3dDiv);
};

export const calculateDistance = (vectorA: Vector3, vectorB: Vector3) => {
  var dx = vectorA.x - vectorB.x;
  // var dy = vectorA.y - vectorB.y;
  var dz = vectorA.z - vectorB.z;

  return Math.sqrt(dx * dx + dz * dz);
};

export const controlModel = (
  wrappedModel: any,
  css3d: any,
  lec: any,
  videoCanvas: any,
  setIsWaiting: () => void
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

      const material = new MeshLambertMaterial({ color: 0x000000 });
      const radius = 1;
      const geometry = new SphereGeometry(radius, 32, 32);
      const sphere = new Mesh(geometry, material);
      sphere.position.copy(config.cameraPositions[2]);

      lec.scene.add(sphere);
      let scaleValue = 1,
        a = 0.1;

      // setTimeout(() => {
      const expand = () => {
        scaleValue += a;
        a += 0.1;

        if (scaleValue < 800) {
          config.systemInit = true;
          sphere.scale.set(scaleValue, scaleValue, scaleValue);
          requestAnimationFrame(expand);
        } else {
          const timer = setTimeout(() => {
            lec.unload();
            clearTimeout(timer);
            setIsWaiting();
          }, 2000);
        }
      };
      expand();
      // }, 3000);
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

      const dis = calculateDistance(
        model.position,
        config.cameraPositions[2] as Vector3
      );
      if (dis < 100) {
        const vec3 = new Vector3().copy(model.position);
        vec3.x -= 700;
        vec3.y += 500;
        vec3.z += 100;
        lec.camera.position.copy(vec3);
        config.systemInit = true;
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

const focus = (lec: any, model: any, controls: any) => {
  lec.camera.lookAt(model.position);
};

export const mount = (obj: any, element: HTMLElement) => {
  obj.mountTo(element);
};

export const start = async (
  lec: any,
  css3d: any,
  controls: any,
  element: HTMLElement,
  setIsWaiting: () => void,
  videoCanvas: ReactElement
) => {
  const [keyGLTF, spaceShipGLTF, computerGLTF] = await loadModels(lec, css3d);
  // mixElement(lec, css3d, videoCanvas);
  mount(lec, element);
  const unloadEventHandlers = controlModel(
    keyGLTF,
    css3d,
    lec,
    videoCanvas,
    setIsWaiting
  );
  focus(lec, keyGLTF.scene, controls);
  mount(css3d, element);

  const update = () => {
    requestAnimationFrame(update);
  };

  return unloadEventHandlers;
};
