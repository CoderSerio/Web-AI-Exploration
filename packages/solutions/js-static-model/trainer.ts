import * as tf from "@tensorflow/tfjs-node";
import mobileNetV3Large from "./model";
import path from "path";
import csv from "csv-parser"; // 或者使用其他支持TS的CSV解析库
import { promisify } from "util";
import * as fs from "fs";
import { Tensor3D } from "@tensorflow/tfjs-node";
import { loadData, trainTestSplit } from "./utils";

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

const image_height = 98,
  image_width = 128,
  image_channel = 3,
  batch_size = 20,
  epochs = 100,
  patience = 10,
  num_classes = 7;

async function train() {
  const [imagesPromises, labels] = loadData(
    "../../datasets/327labeled CK+",
    image_height,
    image_width,
    image_channel,
    num_classes
  );
  const images = await Promise.all(imagesPromises);

  const { trainX, trainY, testX, testY } = trainTestSplit(images, labels);
  const model = mobileNetV3Large();
  model.summary();
}

train();
