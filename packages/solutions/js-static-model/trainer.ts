import * as tf from "@tensorflow/tfjs-node";
import mobileNetV3Large from "./model";
import { EarlyStopping, Optimizer, Tensor3D } from "@tensorflow/tfjs-node";
import { loadData, trainTestSplit } from "./utils";
import wandb from "@wandb/sdk";

interface LabeledData {
  imagePath: string;
  label: number;
}

const imageHeight = 98,
  imageWidth = 128,
  imageChannel = 3,
  batchSize = 20,
  epochs = 40,
  patience = 10,
  numClasses = 7;

async function train() {
  wandb.login({ key: "b67fa778fefd3092eb9112f37886285906ad87ef" });
  wandb.init({
    project: "your_project_name",
    name: "mobilenet_v3_large_js",
    config: {
      imageHeight,
      imageWidth,
      imageChannel,
      batchSize,
      epochs,
      patience,
      numClasses,
    },
  });

  const [imagesPromises, labels] = loadData(
    "../../datasets/327labeled CK+",
    imageHeight,
    imageWidth,
    imageChannel,
    numClasses
  );
  const images = await Promise.all(imagesPromises);
  // 将图像Tensors堆叠成一个批次
  const { trainX, trainY, testX, testY } = trainTestSplit(images, labels, 0.3);
  const trX = tf.stack(trainX);
  const teX = tf.stack(testX);
  const trY = tf.oneHot(trainY, numClasses);
  const teY = tf.oneHot(testY, numClasses);

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

  console.log("启动！");
  const history = await model.fit(trainX, trainY, {
    batchSize,
    verbose: 1,
    epochs,
    validationData: [teX, teY],
    callbacks: [
      new EarlyStopping({
        monitor: "val_loss",
        patience,
      }),
    ],
  });

  for (const epoch in history.history["loss"]) {
    wandb.log({
      train_loss: history.history["loss"][epoch],
      train_accuracy: history.history["accuracy"][epoch],
    });
    wandb.log({
      val_loss: history.history["val_loss"][epoch],
      val_accuracy: history.history["val_accuracy"][epoch],
    });
  }

  console.log(history);
  await model.save(
    `file://./packages/solutions/python-server/models/model_${history.history?.["acc"] ?? "unknown"}`
  );
  wandb.finish();
}

train();
