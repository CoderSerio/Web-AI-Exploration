import {
  layers,
  model,
  mul,
  Multiply,
  regularizers,
  scalar,
  sequential,
  Tensor,
} from "@tensorflow/tfjs-node";

const makeDivisible = (num: number) => {
  return 1;
};

function partial(originalFunction, ...presetArgs) {
  console.log("bug1", originalFunction);
  return function (...remainingArgs) {
    return originalFunction(...presetArgs, ...remainingArgs);
  };
}

function correctPad(inputSize, kernelSize) {
  if (typeof inputSize === "number") {
    inputSize = [inputSize, inputSize];
  }

  kernelSize = [kernelSize, kernelSize];

  const adjust = [1 - (inputSize[0] % 2), 1 - (inputSize[1] % 2)];
  const correct = [kernelSize[0] / 2, kernelSize[1] / 2];

  return [
    [correct[0] - adjust[0], correct[0]],
    [correct[1] - adjust[1], correct[1]],
  ];
}

class HardSigmoid extends layers.Layer {
  constructor(config) {
    super(config);
    (this as any).name = config.name;
    (this as any).relu6 = layers.reLU({
      maxValue: 6,
    });
  }

  call(inputs, kwargs) {
    const x = (this as any).apply(inputs.add(3)).mul(scalar(1 / 6));
    return x;
  }
}
class HardSwish extends layers.Layer {
  constructor(config) {
    super(config);
    (this as any).name = config.name;
    (this as any).hardSigmoid = new HardSigmoid({
      name: config.name,
    }); // 假设HardSigmoid类已经存在且正确实现
  }

  call(inputs: Tensor, kwargs): Tensor | Tensor[] {
    const sigmoidOutput = (this as any).hardSigmoid.call(inputs, kwargs);
    const result = mul(sigmoidOutput, inputs);
    return result;
  }
}

const seBlock = (inputs, filters: number, prefix: string, seRation = 1 / 4) => {
  let x = layers
    .globalAveragePooling2d({
      name: prefix + "squeeze_excite-AvgPool",
    })
    .apply(inputs);

  x = layers.reshape({ targetShape: [1, 1, filters] }).apply(x);

  x = layers
    .conv2d({
      filters: makeDivisible(filters * seRation),
      kernelSize: 1,
      name: prefix + "squeeze_excite-Conv",
      padding: "same",
    })
    .apply(x);

  x = layers
    .reLU({
      name: prefix + "squeeze_excite-Relu",
    })
    .apply(x);

  x = layers
    .conv2d({
      filters,
      kernelSize: 1,
      padding: "same",
      name: prefix + "squeeze_excite-Conv_1",
    })
    .apply(x);

  x = new HardSigmoid({ name: prefix + "squeeze_excite-HardSigmoid" }).apply(x);

  x = layers.multiply({ name: prefix + "squeeze_excite-Mul" }).apply(x);

  return x;
};

const invertedResBlock = (
  x,
  inputC,
  kernelSize,
  expC,
  outC,
  useSe,
  activation,
  stride,
  blockId,
  alpha
) => {
  let bottleNeck = partial(layers.batchNormalization, {
    epsilon: 0.001,
    momentum: 0.99,
  });

  inputC = makeDivisible(inputC * alpha);
  expC = makeDivisible(expC * alpha);
  outC = makeDivisible(outC * alpha);

  let act = activation === "RE" ? layers.reLU : HardSwish;
  let shortCut = x;
  let prefix = "expanded_conv-";

  if (blockId) {
    prefix = `expanded_conv_${blockId}-`;
    x = layers
      .conv2d({
        filters: expC,
        kernelSize: 1,
        padding: "same",
        name: prefix + "expand",
        kernelRegularizer: regularizers.l2({ l2: 0.01 }),
        useBias: false,
      })
      .apply(x);
    x = bottleNeck({ name: prefix + "expand-BatchNorm" }).apply(x);
    x = (act as any)({ name: prefix + "expand-BatchNorm-act" }).apply(x);
  }

  if (stride === 2) {
    let inputSize = [x.shape[1], x.shape[2]];
    x = layers.zeroPadding2d({
      padding: correctPad(inputSize, kernelSize) as any,
      name: prefix + "depthwise-pad",
    });
  }

  x = layers
    .depthwiseConv2d({
      kernelSize: kernelSize,
      strides: stride,
      padding: "same",
      depthMultiplier: 1,
      name: prefix + "depthwise",
      useBias: false,
    })
    .apply(x);

  x = bottleNeck({ name: prefix + "depthwise-BatchNorm" }).apply(x);
  x = (act as any)({ name: prefix + "depthwise-Action" }).apply(x);

  if (useSe) {
    x = seBlock(x, expC, prefix);
  }

  x = layers
    .conv2d({
      filters: outC,
      kernelSize: 1,
      padding: "same",
      name: prefix + "project",
      useBias: false,
    })
    .apply(x);
  x = bottleNeck({ name: prefix + "project-BatchNorm" }).apply(x);

  if (stride === 1 && inputC === outC) {
    x = layers.add({ name: prefix + "Add" }).apply([x, shortCut]);
  }

  return x;
};

const mobileNetV3Large = (
  inputShape = [224, 224, 3],
  numClass = 7,
  alpha = 1.0,
  includeTop = true
) => {
  let bottleNeck = partial(layers.batchNormalization, {
    epsilon: 0.001,
    momentum: 0.99,
  });
  const imgInput = layers.input({ shape: inputShape });
  let x = layers
    .conv2d({
      filters: 16,
      kernelSize: 3,
      strides: [2, 2],
      padding: "same",
      name: "Conv",
      useBias: false,
    })
    .apply(imgInput);

  x = bottleNeck({ name: "Conv-BatchNorm" }).apply(x);
  x = new HardSwish({ name: "Conv-HardSwish" }).apply(x);

  const invertedCnf = partial(invertedResBlock, { alpha });

  x = invertedCnf(x, 16, 3, 16, 16, false, "RE", 1, 0);
  x = invertedCnf(x, 16, 3, 64, 24, false, "RE", 2, 1);
  x = invertedCnf(x, 24, 3, 72, 24, false, "RE", 1, 2);
  x = invertedCnf(x, 24, 5, 72, 40, true, "RE", 2, 3);
  x = invertedCnf(x, 40, 5, 120, 40, true, "RE", 1, 4);
  x = invertedCnf(x, 40, 5, 120, 40, true, "RE", 1, 5);
  x = invertedCnf(x, 40, 3, 240, 80, false, "HS", 2, 6);
  x = invertedCnf(x, 80, 3, 200, 80, false, "HS", 1, 7);
  x = invertedCnf(x, 80, 3, 184, 80, false, "HS", 1, 8);
  x = invertedCnf(x, 80, 3, 184, 80, false, "HS", 1, 9);
  x = invertedCnf(x, 80, 3, 480, 112, true, "HS", 1, 10);
  x = invertedCnf(x, 112, 3, 672, 112, true, "HS", 1, 11);
  x = invertedCnf(x, 112, 5, 672, 160, true, "HS", 2, 12);
  x = invertedCnf(x, 160, 5, 960, 160, true, "HS", 1, 13);
  x = invertedCnf(x, 160, 5, 960, 160, true, "HS", 1, 14);

  const lastC = makeDivisible(160 * 6 * alpha);
  const lastPointC = makeDivisible(160 * 6 * alpha);

  x = layers
    .conv2d({
      filters: lastC,
      kernelSize: 1,
      padding: "same",
      name: "Conv_1",
      useBias: false,
    })
    .apply(x);

  x = bottleNeck({ name: "Conv_1-BatchNorm" }).apply(x);
  x = new HardSigmoid({ name: "Conv_1-BatchNorm" }).apply(x);

  if (includeTop) {
    x = layers.globalAveragePooling2d({}).apply(x);

    x = layers.reshape({ targetShape: [1, 1, lastC] }).apply(x);

    x = layers
      .conv2d({
        filters: lastPointC,
        kernelSize: 1,
        padding: "same",
        name: "Conv2",
      })
      .apply(x);
    x = new HardSwish({ name: "Conv2-HardSwish" }).apply(x);

    x = layers
      .conv2d({
        filters: lastPointC,
        kernelSize: 1,
        padding: "same",
        name: "Conv2",
      })
      .apply(x);
    x = layers.flatten().apply(x);
    x = layers.softmax({ name: "Predictions" }).apply(x);
  }

  const m = model({
    inputs: imgInput,
    outputs: x as any,
    name: "MobilenetV3Large",
  });

  return m;
};

export default mobileNetV3Large;
