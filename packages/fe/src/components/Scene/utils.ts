import lec3d from "@trickle/lec3d";
import ReactDOM from "react-dom/client";
import { ReactElement } from "react";

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

  lec.addControls();
  lec.renderer.setPixelRatio(window.devicePixelRatio);
  lec.camera.position.x = 0;
  lec.camera.position.y = 2000;
  lec.camera.position.z = 1800;
  lec.camera.lookAt(0, 10, 0);
  return { lec, css3d };
};

export const loadModels = async (lec: any) => {
  const { model: land } = await lec3d.loadGLTF({
    modelPath: "3d/island/scene.gltf",
    options: {
      scale: 4,
    },
  });

  const { gltf, model: fox } = await lec3d.loadGLTF({
    modelPath: "3d/fox/untitled.glb",
    options: {
      scale: 200,
    },
  });

  // const { model: fox } = await lec3d.loadFBX({
  //   modelPath: "3d/vrchat-fox/source/ref sheet.fbx",
  // });
  console.log("fox", gltf, fox);
  setTimeout(() => {
    console.log("fox2", fox, fox.animations);
  }, 1000);

  lec.scene.add(land);
  lec.scene.add(fox);
};

export const mixElement = (lec: any, css3d: any, jsx: ReactElement) => {
  const div = document.createElement("div");
  // div.innerHTML =
  //   '<div style="width: 800px; height: 800px;">Hi: <input /></div>';
  ReactDOM.createRoot(div).render(jsx);
  const css3dObj = css3d.createCss3dObject({ element: div });
  css3dObj.position.y = 1000;
  lec.scene.add(css3dObj);
};

export const mount = (obj: any, element: HTMLElement) => {
  obj.mountTo(element);
};

export const start = async (
  lec: any,
  css3d: any,
  element: HTMLElement,
  videoCanvas: ReactElement
) => {
  await loadModels(lec);
  mixElement(lec, css3d, videoCanvas);
  mount(lec, element);
  mount(css3d, element);
};
