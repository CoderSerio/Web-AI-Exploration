import * as tf from "@tensorflow/tfjs-node";
import mobileNetV3Large from "./model";
import * as fs from "fs";
import { EarlyStopping, Optimizer, Tensor3D } from "@tensorflow/tfjs-node";
import { loadData, trainTestSplit } from "./utils";
import path from "path";

interface LabeledData {
  imagePath: string;
  label: number;
}

const model = tf.sequential();
model.add(tf.layers.dense({ units: 1, inputShape: [200] }));
model.compile({
  loss: "meanSquaredError",
  optimizer: "sgd",
  metrics: ["MAE"],
});

const imageHeight = 98,
  imageWidth = 128,
  imageChannel = 3,
  batchSize = 10,
  epochs = 100,
  patience = 10,
  numClasses = 7;

async function train() {
  const [imagesPromises, labels] = loadData(
    "../../datasets/327labeled CK+",
    imageHeight,
    imageWidth,
    imageChannel,
    numClasses
  );
  const images = await Promise.all(imagesPromises);
  // 将图像Tensors堆叠成一个批次
  const trainX = tf.stack(images);
  const trainY = tf.oneHot(labels, numClasses);

  console.log("数据", trainX, trainY);

  const model = mobileNetV3Large({
    inputShape: [imageHeight, imageWidth, imageChannel],
    alpha: 1.0,
    includeTop: true,
    numClasses,
  });
  model.summary();

  const optimizer = tf.train.adam(0.0005);
  model.compile({
    optimizer,
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  const history = await model.fit(trainX, trainY, {
    batchSize: 10,
    verbose: 1,
    epochs: 10,
    // validationSplit: 0.3,
    // callbacks: [
    //   new EarlyStopping({
    //     monitor: "val_loss",
    //     patience,
    //   }),
    // ],
  });
  console.log(history);
  await model.save("file://./models");
}

train();
