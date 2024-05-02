import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import * as tf from "@tensorflow/tfjs-node";

const imageHeight = 98,
  imageWidth = 128,
  imageChannel = 3,
  batchSize = 20,
  epochs = 100,
  patience = 10,
  numClasses = 7;

const number2expression = [
  "angry",
  "neutral",
  "disgust",
  "fear",
  "happy",
  "sad",
  "surprised",
];

const expression2number = {
  angry: 0,
  neutral: 1,
  disgust: 2,
  fear: 3,
  happy: 4,
  sad: 5,
  surprised: 6,
};

export const loadData = (folderPath, height, weight, channel, classNum) => {
  const imagesPromises = [];
  const labels = [];
  const datasetDirPath = path.join(__dirname, folderPath);
  const labelNames = fs.readdirSync(datasetDirPath);

  labelNames.forEach((labelName) => {
    const labelDirPath = path.join(datasetDirPath, labelName);
    const personNames = fs.readdirSync(labelDirPath);

    personNames.forEach(async (personName) => {
      const personDirPath = path.join(labelDirPath, personName);
      const imageNames = fs.readdirSync(personDirPath);

      imageNames.forEach((imageName) => {
        const imagePath = path.join(personDirPath, imageName);

        const bufferPromise = sharp(imagePath)
          .resize(height, weight, { kernel: "lanczos3" }) // 使用Lanczos插值算法
          .toBuffer()
          .then((buffer) => {
            const imageTensor = tf.node.decodeImage(buffer, 3);
            const normalizedImage = imageTensor.div(tf.scalar(255));
            const formattedImage = normalizedImage.reshape([height, weight, 3]);
            return formattedImage;
          });
        labels.push(+labelName - 1);
        imagesPromises.push(bufferPromise);
      });
    });
  });
  const res = [imagesPromises, labels];
  return res;
};

export const trainTestSplit = (
  x: Array<any>,
  y: Array<any>,
  testSize = 0.3
) => {
  const testSetLen = Math.floor(x.length * 0.3);
  // const trainSetLen = x.length - testSetLen;

  const trainX: any[] = [],
    trainY: any[] = [],
    testX: any[] = [],
    testY: any[] = [];

  const shuffle = () => {
    let { length } = x;
    for (let i = 0; i < x.length; i++) {
      const luckyKey = Math.floor(Math.random() * length + i);
      [x[i], x[luckyKey]] = [x[luckyKey], x[i]];
      [y[i], y[luckyKey]] = [y[luckyKey], y[i]];
      length--;
    }
  };

  shuffle();
  for (let i = 0; i < x.length; i++) {
    if (i < testSetLen) {
      testX.push(x[i]);
      testY.push(y[i]);
    } else {
      trainX.push(x[i]);
      trainY.push(y[i]);
    }
  }

  return {
    trainX,
    trainY,
    testX,
    testY,
  };
};
