import os
from PIL import Image
import numpy as np
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow.keras import layers
import matplotlib.pyplot as plt
from tensorflow.keras.optimizers import Adam



expression_2_number = ['angry', 'disgust',
                       'fear', 'happy', 'neutral', 'sad', 'surprise']
number_2_expression = {expression: index for index,
                       expression in enumerate(expression_2_number)}


def load_data(folder_path, height, weight, channel, class_num):
    images = []
    labels = []

    for label_name in os.listdir(folder_path):
        label_folder_path = os.path.join(folder_path, label_name)
        for image_name in os.listdir(label_folder_path):
            image_path = os.path.join(label_folder_path, image_name)
            image = Image.open(image_path).convert('RGB')
            resized_image = image.resize((height, weight), Image.Resampling.LANCZOS)
            image_nd_array = np.array(resized_image) / 255
            formatted_image = image_nd_array.reshape((height, weight, channel))

            labels.append(number_2_expression[label_name])
            images.append(formatted_image)
    

    nd_array_images = np.array(images)
    nd_array_labels = np.array(labels)
    train_labels_one_hot = tf.keras.utils.to_categorical(nd_array_labels, class_num)

    return nd_array_images, train_labels_one_hot


def predict(model, nd_array_images, labels):
    prediction = model.predict(nd_array_images)
    # 将预测向量转换为标签，predictions是one-hot编码，需要argmax获取最大概率对应的类别
    predicted_classes = np.argmax(prediction, axis=1)
    print('Predictions:', prediction, predicted_classes)
    accuracy = np.sum(predicted_classes == labels) / len(nd_array_images)
    print(f"Accuracy: {accuracy * 100:.2f}%")

    return predicted_classes
