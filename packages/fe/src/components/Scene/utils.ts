import { Vector3 } from "three/src/math/Vector3";

export const config = {
  canvasLoaded: false,
  offset: 240,
  sizeUnit: 100,
  moveSpeed: 5 * 10,
  jumpMaxHeight: 40 * 18,
  animationSpeed: 0.01,
  jumpStatus: "STABLE", // 'STABLE' | 'UP' | 'DOWN',
  cameraPositions: [
    new Vector3(0, 0, 0),
    new Vector3(-1780, 400, 0),
    new Vector3(2500, 600, 120),
  ],
  currentCameraPositionIndex: 0,
  systemInit: false,
};

export const calculateDistance = (vectorA: Vector3, vectorB: Vector3) => {
  const dx = vectorA.x - vectorB.x;
  const dz = vectorA.z - vectorB.z;

  return Math.sqrt(dx * dx + dz * dz);
};

export const focus = (lec: any, model: any, controls: any) => {
  lec.camera.lookAt(model.position);
};

export const mount = (obj: any, element: HTMLElement) => {
  obj.mountTo(element);
};
