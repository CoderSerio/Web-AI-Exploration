import {
  add,
  layers,
  model,
  mul,
  regularizers,
  relu,
  Relu,
  relu6,
  scalar,
  Tensor,
} from "@tensorflow/tfjs-node";

function makeDivisible(ch, divisor = 8, minCh = null) {
  // 如果minCh未提供，则默认为divisor
  const min = minCh || divisor;

  // 计算最接近ch且能被divisor整除的数
  let newCh = Math.max(min, Math.floor((ch + divisor / 2) / divisor) * divisor);

  // 确保向下取整不会减少超过原值的10%，若减少了则向上增加divisor
  if (newCh < 0.9 * ch) {
    newCh += divisor;
  }

  return newCh;
}

const partial = (originalFunction, presetArgs: Record<string, any>) => {
  return function (remainingArgs) {
    return originalFunction({ ...presetArgs, ...remainingArgs });
  };
};

const correctPad = (inputSize, kernelSize) => {
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
};

const handleActivation = ({ activation, name, x }) => {
  if (activation === "SE") {
    return layers.reLU({ name }).apply(x);
  } else {
    return new HardSwish({ name }).apply(x);
  }
};

class HardSigmoid extends layers.Layer {
  relu6: Tensor<any>;
  constructor(config) {
    super(config);
  }

  call(inputs) {
    const shiftedInputs = add(inputs[0], scalar(3));
    const scaledInputs = shiftedInputs.div(scalar(6));
    const x = relu6(scaledInputs);
    return x;
  }
}
class HardSwish extends layers.Layer {
  constructor(config) {
    super(config);
    (this as any).name = config.name;
    (this as any).hardSigmoid = new HardSigmoid({
      name: config.name,
    });
  }

  call(inputs: Tensor, kwargs): Tensor | Tensor[] {
    const sigmoidOutput = (this as any).hardSigmoid.call(inputs, kwargs);
    const result = mul(sigmoidOutput, inputs[0]);
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

  x = layers
    .multiply({ name: prefix + "squeeze_excite-Mul" })
    .apply([inputs, x]);

  return x;
};

const invertedResBlock = ({
  x,
  inputC,
  kernelSize,
  expC,
  outC,
  useSe,
  activation,
  stride,
  blockId,
  alpha,
}) => {
  let bottleNeck = partial(layers.batchNormalization, {
    epsilon: 0.001,
    momentum: 0.99,
  });

  inputC = makeDivisible(inputC * alpha);
  expC = makeDivisible(expC * alpha);
  outC = makeDivisible(outC * alpha);

  // const act = activation === "RE" ? layers.reLU : HardSwish;

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
    x = handleActivation({ activation, name: prefix + "depthwise-Action1", x });
  }

  if (stride === 2) {
    let inputSize = [x.shape[1], x.shape[2]];
    x = layers
      .zeroPadding2d({
        padding: correctPad(inputSize, kernelSize) as any,
        name: prefix + "depthwise-pad",
      })
      .apply(x);
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
  x = handleActivation({ activation, name: prefix + "depthwise-Action2", x });

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

const mobileNetV3Large = ({ inputShape, alpha, includeTop, numClasses }) => {
  // tensor4d;
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

  x = invertedResBlock({
    x,
    inputC: 16,
    kernelSize: 3,
    expC: 16,
    outC: 16,
    useSe: false,
    activation: "RE",
    stride: 1,
    blockId: 0,
    alpha,
  });

  x = invertedResBlock({
    x,
    inputC: 16,
    kernelSize: 3,
    expC: 64,
    outC: 24,
    useSe: false,
    activation: "RE",
    stride: 2,
    blockId: 1,
    alpha,
  });
  x = invertedResBlock({
    x,
    inputC: 24,
    kernelSize: 3,
    expC: 72,
    outC: 24,
    useSe: false,
    activation: "RE",
    stride: 1,
    blockId: 2,
    alpha,
  });
  x = invertedResBlock({
    x,
    inputC: 24,
    kernelSize: 5,
    expC: 72,
    outC: 40,
    useSe: true,
    activation: "RE",
    stride: 2,
    blockId: 3,
    alpha,
  });
  x = invertedResBlock({
    x,
    inputC: 40,
    kernelSize: 5,
    expC: 120,
    outC: 40,
    useSe: true,
    activation: "RE",
    stride: 1,
    blockId: 4,
    alpha,
  });
  x = invertedResBlock({
    x,
    inputC: 40,
    kernelSize: 5,
    expC: 120,
    outC: 40,
    useSe: true,
    activation: "RE",
    stride: 1,
    blockId: 5,
    alpha,
  });
  x = invertedResBlock({
    x,
    inputC: 40,
    kernelSize: 3,
    expC: 240,
    outC: 80,
    useSe: false,
    activation: "HS",
    stride: 2,
    blockId: 6,
    alpha,
  });
  x = invertedResBlock({
    x,
    inputC: 80,
    kernelSize: 3,
    expC: 200,
    outC: 80,
    useSe: false,
    activation: "HS",
    stride: 1,
    blockId: 7,
    alpha,
  });
  x = invertedResBlock({
    x,
    inputC: 80,
    kernelSize: 3,
    expC: 184,
    outC: 80,
    useSe: false,
    activation: "HS",
    stride: 1,
    blockId: 8,
    alpha,
  });
  x = invertedResBlock({
    x,
    inputC: 80,
    kernelSize: 3,
    expC: 184,
    outC: 80,
    useSe: true,
    activation: "HS",
    stride: 1,
    blockId: 9,
    alpha,
  });
  x = invertedResBlock({
    x,
    inputC: 80,
    kernelSize: 3,
    expC: 480,
    outC: 112,
    useSe: true,
    activation: "HS",
    stride: 1,
    blockId: 10,
    alpha,
  });
  x = invertedResBlock({
    x,
    inputC: 112,
    kernelSize: 3,
    expC: 672,
    outC: 112,
    useSe: true,
    activation: "HS",
    stride: 1,
    blockId: 11,
    alpha,
  });
  x = invertedResBlock({
    x,
    inputC: 112,
    kernelSize: 5,
    expC: 672,
    outC: 160,
    useSe: true,
    activation: "HS",
    stride: 2,
    blockId: 12,
    alpha,
  });
  x = invertedResBlock({
    x,
    inputC: 160,
    kernelSize: 5,
    expC: 960,
    outC: 160,
    useSe: true,
    activation: "HS",
    stride: 1,
    blockId: 13,
    alpha,
  });
  x = invertedResBlock({
    x,
    inputC: 160,
    kernelSize: 5,
    expC: 960,
    outC: 160,
    useSe: true,
    activation: "HS",
    stride: 1,
    blockId: 14,
    alpha,
  });

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

  x = bottleNeck({ name: "Conv_1-BatchNorm-1" }).apply(x);
  x = new HardSigmoid({ name: "Conv_1-BatchNorm-2" }).apply(x);
  console.log("这ok吗", x);

  if (includeTop) {
    x = layers.globalAveragePooling2d({}).apply(x);

    x = layers.reshape({ targetShape: [1, 1, lastC] }).apply(x);

    x = layers
      .conv2d({
        filters: lastPointC,
        kernelSize: 1,
        padding: "same",
        name: "Conv2-1",
      })
      .apply(x);
    x = new HardSwish({ name: "Conv2-HardSwish" }).apply(x);

    x = layers
      .conv2d({
        filters: numClasses,
        kernelSize: 1,
        padding: "same",
        name: "Logits-Conv2d_1c_1x1",
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
