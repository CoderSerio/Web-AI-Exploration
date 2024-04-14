import tensorflowjs as tfjs
import tensorflow as tf

model = tf.keras.models.load_model(
    '../python-server/models/MobileNetV3_0.9631310105323792.h5'
)
print(model)
