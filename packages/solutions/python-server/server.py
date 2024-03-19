from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import json

with open('env-configs.json', 'r') as file:
    json_data = json.load(file)
    print(json_data)

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app)


@socketio.on(json_data['socket-keys']['solution-python-server'])
def handle_message(data):
    print(f"Received data from BFF: {data}")

    emit('response_event_name', {
         'response': 'Processed data...'}, broadcast=False)


if __name__ == '__main__':
    socketio.run(
        app,
        host=json_data['ip'],
        port=json_data['ports']['solution-python-server']
    )
