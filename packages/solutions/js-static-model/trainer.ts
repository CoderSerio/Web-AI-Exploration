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
  batchSize = 5,
  epochs = 2,
  patience = 10,
  numClasses = 7;

async function train() {
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
  const trainX = tf.stack(images);
  const trainY = tf.oneHot(labels, numClasses);

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
    batchSize,
    verbose: 1,
    epochs,
    validationSplit: 0.3,
    callbacks: [
      new EarlyStopping({
        monitor: "val_loss",
        patience,
      }),
    ],
  });

  for (const epoch in history.history["loss"]) {
    console.log(history, history.history);
    wandb.log({
      train_loss: history.history["loss"]?.[epoch] ?? 0,
      train_accuracy: history.history["accuracy"]?.[epoch] ?? 0,
    });
    wandb.log({
      val_loss: history.history["val_loss"]?.[epoch] ?? 0,
      val_accuracy: history.history["val_accuracy"]?.[epoch] ?? 0,
    });
  }

  console.log(history);
  await model.save(
    `file://./packages/solutions/js-static-model/models/model_${history.history?.["accuracy"] ?? "unknown"}`
  );
  wandb.finish();
}

train();
