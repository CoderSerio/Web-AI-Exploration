import os
from PIL import Image
import numpy as np
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow.keras import layers
import matplotlib.pyplot as plt
from tensorflow.keras.optimizers import Adam
from io import BytesIO
from PIL import Image
import numpy as np
import base64
import cv2
import re

image_height = 98
image_width = 128

number_2_expression = ['angry', 'disgust',
                       'fear', 'happy', 'neutral', 'sad', 'surprise']
expression_2_number = {expression: index for index,
                       expression in enumerate(number_2_expression)}


def load_data(folder_path, height, weight, channel, class_num):
    images = []
    labels = []

    for label_name in os.listdir(folder_path):
        label_next_folder = os.path.join(folder_path, label_name)

        for label_next_folder_name in os.listdir(label_next_folder):
            label_folder_path = os.path.join(
                label_next_folder, label_next_folder_name)
            for image_name in os.listdir(label_folder_path):
                image_path = os.path.join(label_folder_path, image_name)
                image = Image.open(image_path).convert('RGB')
                resized_image = image.resize(
                    (height, weight), Image.Resampling.LANCZOS)
                image_nd_array = np.array(resized_image) / 255
                formatted_image = image_nd_array.reshape(
                    (height, weight, channel))

                label_key = int(label_name) - 1
                labels.append(label_key)
                images.append(formatted_image)

    nd_array_images = np.array(images)
    nd_array_labels = np.array(labels)
    train_labels_one_hot = tf.keras.utils.to_categorical(
        nd_array_labels, class_num)

    return nd_array_images, train_labels_one_hot


def predict(model, nd_array_images):
    prediction = model.predict(nd_array_images)
    # 将预测向量转换为标签，predictions是one-hot编码，需要argmax获取最大概率对应的类别
    predicted_classes = np.argmax(prediction, axis=1)

    return predicted_classes


def format_data_from_frontend(base64_uri):
    match = re.match(r'data:image\/([a-zA-Z]*);base64,(.*)', base64_uri)
    useful_base64 = match.group(2)
    image_data = base64.b64decode(useful_base64)
    image = np.frombuffer(image_data, np.uint8)
    # 使用OpenCV解码图像
    nd_image = cv2.imdecode(image, cv2.IMREAD_COLOR)
    nd_image.reshape(image_height, image_width, 3)
    nd_array = np.array([nd_image / 255.0])

    return nd_array
