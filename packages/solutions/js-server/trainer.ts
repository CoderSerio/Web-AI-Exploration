import * as tf from "@tensorflow/tfjs-node"; // 或者 '@tensorflow/tfjs' 如果在浏览器环境
import * as fs from "fs"; // Node.js环境下读取文件
import { mobilenet_v3_large } from "./model"; // 假设你已经有了对应的Mobilenet V3模型定义
import { loadData } from "./utils"; // 假设你有对应的加载数据的函数

const imageHeight = 96;
const imageWidth = 96;
const imageChannel = 3;
const batchSize = 100;
const epochs = 100;
const patience = 10;
const numClasses = 7;

async function load(): Promise<[tf.TensorContainer, tf.TensorContainer]> {
  const [trainX, trainY] = await loadData(
    "packages/datasets/images/train",
    imageHeight,
    imageWidth,
    imageChannel,
    numClasses
  );
  const [testX, testY] = await loadData(
    "packages/datasets/images/validation",
    imageHeight,
    imageWidth,
    imageChannel,
    numClasses
  );

  // 数据预处理（假设loadData返回的是原始图像数据，这里需要转换为张量并归一化等操作）
  // 示例：
  const trainInputs = tf.tidy(() => {
    return tf
      .cast(tf.tensor(trainX), "float32")
      .div(255)
      .reshape([-1, imageHeight, imageWidth, imageChannel]);
  });
  const trainLabels = tf.oneHot(tf.tensor(trainY), numClasses);
  // 对testX和testY做类似处理...

  return [trainInputs, trainLabels];
}

function createModel(): tf.Sequential {
  const model = mobilenet_v3_large(
    imageHeight,
    imageWidth,
    imageChannel,
    numClasses,
    true
  );
  // 假设mobilenet_v3_large返回一个Sequential模型，如果没有，你需要手动配置模型结构和输出层
  model.compile({
    optimizer: tf.train.adam(0.0005),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });
  return model;
}

async function train(model: tf.Sequential): Promise<tf.History> {
  const [trainInputs, trainLabels] = await load();

  const history = await model.fit(trainInputs, trainLabels, {
    batchSize,
    epochs,
    validationSplit: 0.2, // 如果没有明确的测试集，可以设置验证集比例
    callbacks: [
      tf.callbacks.earlyStopping({
        monitor: "val_loss",
        patience,
        restoreBestWeights: true,
      }),
    ],
  });

  return history;
}

async function saveModel(
  model: tf.Sequential,
  accuracy: number
): Promise<void> {
  await model.save(
    `./packages/solutions/js-server/models/MobileNetV3_${accuracy.toFixed(4)}.json`,
    { saveFormat: "json" }
  ); // TF.js默认保存为JSON格式
  // 若要保存为其他格式如TensorFlow SavedModel，请查阅官方文档使用不同的保存方式
}

async function drawLoss(history: tf.History): Promise<void> {
  // TF.js的history对象和Keras略有不同，但基本属性相似
  const trainingLoss = history.history.loss as number[];
  const validationLoss = history.history.val_loss as number[];

  // 使用Plotly、D3或其他适合TS的绘图库绘制曲线
  // 这里仅给出伪代码示意
  plotLossOverEpochs(
    [...trainingLoss, ...validationLoss],
    ["Training Loss", "Validation Loss"]
  );
}

async function main() {
  const model = createModel();
  const history = await train(model);
  console.log(history.history);
  await saveModel(
    model,
    history.history.val_accuracy[history.history.val_accuracy.length - 1]
  );
  // drawLoss(history); // 如果是在Node.js环境中，可能需要额外安装和配置绘图库
}

main();
