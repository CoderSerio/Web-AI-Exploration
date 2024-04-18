from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from utils import format_data_from_frontend
import json
from utils import format_data_from_frontend, predict
import tensorflow as tf

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app)
# model = tf.saved_model.load('path_to_saved_model')
model = tf.keras.models.load_model(
    './models/MobileNetV3_0.9668367505073547.keras'
)


@app.route('/')
def hello_world():
    return 'Hello, World!'


@socketio.on('python-server-message')
def handle_message(data):
    nd_array = format_data_from_frontend(data['content'])
    res = predict(model, nd_array).tolist()
    print(f"从 BFF 获取到了数据, 预测结果是: {res}\n")
    emit(
        'backend-for-frontend-message',
        {'type': 'server', 'id': 'python-server', 'content': res}, broadcast=False
    )


if __name__ == '__main__':
    socketio.run(
        app,
        host='127.0.0.1',
        port='8820',
        allow_unsafe_werkzeug=True
    )
