from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from utils import format_data_from_frontend
import json
from utils import format_data_from_frontend, predict
import tensorflow as tf


with open('env-configs.json', 'r') as file:
    json_data = json.load(file)
    print(json_data)

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app)
model = tf.keras.models.load_model(
    'packages/solutions/python-server/MobileNetV3.keras'
)


@socketio.on(json_data['socket-keys']['solution-python-server'])
def handle_message(data):
    nd_array = format_data_from_frontend(data['content'])
    res = predict(model, nd_array).tolist()
    print(f"从 BFF 获取到了数据, 预测结果是: {res}\n")
    emit('python-server-message',
         {'id': 'server', 'content': res}, broadcast=False)


if __name__ == '__main__':
    socketio.run(
        app,
        host=json_data['ip'],
        port=json_data['ports']['solution-python-server']
    )
