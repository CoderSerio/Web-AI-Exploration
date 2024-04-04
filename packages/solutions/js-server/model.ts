import * as tf from '@tensorflow/tfjs-node';
import { Layers, LayersModel, tensor1d, tidy } from '@tensorflow/tfjs';

// 类型定义
type Padding = 'same' | 'valid';

// 实现辅助函数
function _makeDivisible(ch: number, divisor = 8, minCh?: number): number {
  if (minCh === undefined) {
    minCh = divisor;
  }
  const newCh = Math.max(minCh, Math.ceil((ch + divisor / 2) / divisor) * divisor);
  if (newCh < 0.9 * ch) {
    newCh += divisor;
  }
  return newCh;
}

function correctPad(inputSize: number | [number, number], kernelSize: number): [[number, number], [number, number]] {
  const inputShape: [number, number] = Array.isArray(inputSize) ? inputSize : [inputSize, inputSize];
  const kernelShape: [number, number] = [kernelSize, kernelSize];

  const adjust: [number, number] = [(1 - inputShape[0] % 2), (1 - inputShape[1] % 2)];
  const correct: [number, number] = [(kernelShape[0] - 1) / 2, (kernelShape[1] - 1) / 2];
  return [
    [correct[0] - adjust[0], correct[0]],
    [correct[1] - adjust[1], correct[1]],
  ];
}

class HardSigmoid extends Layers.Layer {
  constructor(args) {
    super(args);
  }

  override call(inputs, kwargs) {
    const hardSigmoid = (x: number) => Math.min(Math.max((0.2 * x + 0.5), 0), 1);
    return tidy(() => inputs.mul(hardSigmoid(inputs.asScalar())));
  }
}

class HardSwish extends Layer {
  private hardSigmoid: HardSigmoid;

  constructor(args) {
    super(args);
    this.hardSigmoid = new HardSigmoid();
  }

  override call(inputs: Tensor, kwargs: Kwargs): Tensor {
    return tidy(() => inputs.mul(this.hardSigmoid.call(inputs)));
  }
}

function _seBlock(inputs: Tensor, filters: number, prefix: string, seRatio = 1 / 4): Tensor {
  const globalAvgPool = tf.globalAveragePooling2d(inputs, [1, 1], 'channelsLast');
  const reshaped = tf.reshape(globalAvgPool, [-1, 1, 1, filters]);

  const squeezeExcite = tf.layers.conv2d({
    inputs: reshaped,
    filters: _makeDivisible(filters * seRatio),
    kernelSize: 1,
    padding: 'same',
    activation: 'relu',
    kernelInitializer: 'glorotUniform',
    kernelRegularizer: (x: Tensor) => tf.l2l2loss(x, 0.01),
    biasRegularizer: null,
    name: `${prefix}squeeze_excite-Conv`,
  });

  const conv2dOut = tf.layers.conv2d({
    inputs: squeezeExcite,
    filters,
    kernelSize: 1,
    padding: 'same',
    activation: 'hardSigmoid',
    kernelInitializer: 'glorotUniform',
    kernelRegularizer: (x: Tensor) => tf.l2l2loss(x, 0.01),
    biasRegularizer: null,
    name: `${prefix}squeeze_excite-Conv_1`,
  });

  return tf.mul(inputs, conv2dOut, `${prefix}squeeze_excite-Mul`);
}

function _invertedResBlock(x: Tensor, inputC: number, kernelSize: number, expC: number, outC: number, useSe: boolean, activation: string, stride: number, blockId: number, alpha: number = 1.0): Tensor {
  const batchNorm = (inputs: Tensor, name: string) => tf.layers.batchNormalization({
    axis: 3,
    momentum: 0.99,
    epsilon: 0.001,
    center: true,
    scale: true,
    betaInitializer: 'zeros',
    gammaInitializer: 'ones',
    movingMeanInitializer: '.zeros',
    movingVarianceInitializer: 'ones',
    trainable: true,
    name,
  }).apply(inputs);

  let shortcut = x;
  let prefix = 'expanded_conv-';
  if (blockId > 0) {
    prefix += `expanded_conv_${blockId}-`;
    x = tf.layers.conv2d({
      inputs: x,
      filters: _makeDivisible(inputC * alpha),
      kernelSize: 1,
      padding: 'same',
      activation: 'linear',
      kernelInitializer: 'glorotUniform',
      kernelRegularizer: (x: Tensor) => tf.l2l2loss(x, 0.01),
      biasInitializer: 'zeros',
      biasRegularizer: null,
      name: `${prefix}expand`,
    });

    x = batchNorm(x, `${prefix}expand-BatchNorm`);
    if (activation === 'HS') {
      x = new HardSwish().apply(x);
    } else {
      x = tf.relu(x, `${prefix}expand-ReLU`);
    }
  }

  if (stride === 2) {
    const inputSize = [x.shape[1], x.shape[2]];
    const padAmount = correctPad(inputSize, kernelSize);
    x = tf.pad(x, padAmount, 'constant', 0, `${prefix}depthwise-pad`);
  }

  x = tf.layers.depthwiseConv2d({
    inputs: x,
    kernelSize,
    strides: stride,
    padding: stride === 1 ? 'same' : 'valid',
    activation: 'linear',
    depthMultiplier: 1,
    depthwiseInitializer: 'glorotUniform',
    biasInitializer: 'zeros',
    biasRegularizer: null,
    name: `${prefix}depthwise`,
  });

  x = batchNorm(x, `${prefix}depthwise-BatchNorm`);
  x = tf.dropout(x, 0.2, `${prefix}project-Dropout`);

  if (activation === 'HS') {
    x = new HardSwish().apply(x);
  } else {
    x = tf.relu(x, `${prefix}depthwise-ReLU`);
  }

  if (useSe) {
    x = _seBlock(x, expC, prefix);
  }

  x = tf.layers.conv2d({
    inputs: x,
    filters: _makeDivisible(outC * alpha),
    kernelSize: 1,
    padding: 'same',
    activation: 'linear',
    kernelInitializer: 'glorotUniform',
    kernelRegularizer: (x: Tensor) => tf.l2l2loss(x, 0.01),
    biasInitializer: 'zeros',
    biasRegularizer: null,
    name: `${prefix}project`,
  });

  x = batchNorm(x, `${prefix}project-BatchNorm`);

  if (stride === 1 && inputC === outC) {
    x = tf.add(x, shortcut, `${prefix}Add`);
  }

  return x;
}

function mobilenetV3Large(inputShape: [number, number, number], numClasses: number, alpha: number = 1.0, includeTop: boolean = true): LayersModel {
  const imgInput = tf.input({ shape: inputShape, name: 'Input' });

  let x = tf.layers.conv2d({
    inputs: imgInput,
    filters: 16,
    kernelSize: 3,
    strides: 2,
    padding: 'same',
    activation: 'linear',
    kernelInitializer: 'glorotUniform',
    kernelRegularizer: (x: Tensor) => tf.l2l2loss(x, 0.01),
    biasInitializer: 'zeros',
    biasRegularizer: null,
    name: 'Conv',
  });

  x = tf.layers.batchNormalization({ axis: 3, name: 'Conv-BatchNorm' }).apply(x);
  x = new HardSwish().apply(x);

  const invertedCnf = (input: Tensor, inputC: number, kSize: number, expandC: number, outC: number, useSe: boolean, act: string, stride: number, blockId: number): Tensor => _invertedResBlock(input, inputC, kSize, expandC, outC, useSe, act, stride, blockId, alpha);

  // 各个倒残差块...
  // ...

  // 添加顶部分类层
  if (includeTop) {
    const lastC = _makeDivisible(160 * 6 * alpha);
    const lastPointC = _makeDivisible(1280 * alpha);

    x = tf.layers.conv2d({
      inputs: x,
      filters: lastC,
      kernelSize: 1,
      padding: 'same',
      activation: 'linear',
      kernelInitializer: 'glorotUniform',
      kernelRegularizer: (x: Tensor) => tf.l2l2loss(x, 0.01),
      biasInitializer: 'zeros',
      biasRegularizer: null,
      name: 'Conv_1',
    })(x);

    x = tf.layers.batchNormalization({ axis: 3, name: 'Conv_1-BatchNorm' }).apply(x);
    x = new HardSwish().apply(x);

    if (includeTop) {
      x = tf.avgPool2d(x, x.shape[1:3], 1, 'valid');

      const flattenLayer = tf.layers.flatten({ name: 'Flatten' });
      x = flattenLayer.apply(x);

      x = tf.layers.conv2d({
        inputs: x,
        filters: lastPointC,
        kernelSize: 1,
        padding: 'same',
        activation: 'linear',
        kernelInitializer: 'glorotUniform',
        kernelRegularizer: (x: Tensor) => tf.l2l2loss(x, 0.01),
        biasInitializer: 'zeros',
        biasRegularizer: null,
        name: 'Conv_2',
      })(x);

      x = new HardSwish().apply(x);

      x = tf.layers.conv2d({
        inputs: x,
        filters: numClasses,
        kernelSize: 1,
        padding: 'same',
        activation: 'softmax',
        kernelInitializer: 'glorotUniform',
        kernelRegularizer: (x: Tensor) => tf.l2l2loss(x, 0.01),
        biasInitializer: 'zeros',
        biasRegularizer: null,
        name: 'Logits-Conv2d_1c_1x1',
      })(x);

      // 将最后的卷积层结果展平成一维数组，用于分类任务
      x = flattenLayer.apply(x);
      // 应该不需要 Softmax 层，因为在 Conv2d_1c_1x1 层已经应用了 softmax 激活函数
      // x = tf.layers.softmax({ name: "Predictions" }).apply(x);
    }

    const model = tf.model({ inputs: imgInput, outputs: x, name: 'MobilenetV3Large' });
    return model;
}

export default mobilenetV3Large;