import lec3d from "@trickle/lec3d";

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
  lec.addControls();

  return lec;
};

export const loadModels = async (lec: any) => {
  const { gltf, model } = await lec3d.loadGLTF({
    modelPath: "3d/island/scene.gltf",
    options: {
      scale: 0.1,
    },
  });

  lec.scene.add(model);
};

export const mount = (lec: any, element: HTMLElement) => {
  lec.mountTo(element);
};

export const start = async (lec: any, element: HTMLElement) => {
  await loadModels(lec);
  mount(lec, element);
};
