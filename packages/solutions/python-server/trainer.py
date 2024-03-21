import tensorflow as tf
from model import mobilenet_v3_large, mobilenet_v3_small
from utils import load_data
import matplotlib.pyplot as plt

image_height = 48
image_width = 48
image_channel = 3
batch_size = 100
epochs = 100
patience = 10
num_classes = 7


def load():
    train_x, train_y = load_data(
        'packages/datasets/images/train', image_height, image_width, image_channel, num_classes)
    test_x, test_y = load_data('packages/datasets/images/validation',
                               image_height, image_width, image_channel, num_classes)
    return train_x, train_y, test_x, test_y


def train(train_x, train_y, test_x, test_y):
    model = mobilenet_v3_large(
        input_shape=(image_height, image_width, image_channel),
        num_classes=num_classes,
        include_top=True
    )

    model.summary()

    model.compile(
        optimizer=tf.keras.optimizers.Adam(0.0005),
        loss=tf.keras.losses.CategoricalCrossentropy(),
        metrics=['accuracy'],
    )

    history = model.fit(
        train_x,
        train_y,
        batch_size=batch_size,
        verbose=1,
        epochs=epochs,
        validation_data=(test_x, test_y),
        callbacks=[tf.keras.callbacks.EarlyStopping(
            monitor='val_loss', patience=patience, restore_best_weights=True)]
    )

    return model, history


def draw_loss(history):
    # 提取训练和验证损失的历史记录
    training_loss = history.history['loss']
    validation_loss = history.history['val_loss']
    # 获取训练的epoch数量
    epochs = range(1, len(training_loss) + 1)
    # 绘制训练和验证损失曲线
    plt.figure(figsize=(10, 6))
    plt.plot(epochs, training_loss, label='Training Loss')
    plt.plot(epochs, validation_loss, label='Validation Loss')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.legend()
    plt.title('Training and Validation Loss Over Epochs')
    plt.grid(True)
    plt.savefig('packages/solutions/python-server/losses/loss_{}.png'.format(
        history.history['val_accuracy'][-1]))

    plt.show()


def main():
    train_x, train_y, test_x, test_y = load()
    model, history = train(train_x, train_y, test_x, test_y)
    print(history)
    model.save('./packages/solutions/python-server/models/MobileNetV3_{}.keras'.format(
        history.history['val_accuracy'][-1]))
    draw_loss(history)


if __name__ == '__main__':
    main()
