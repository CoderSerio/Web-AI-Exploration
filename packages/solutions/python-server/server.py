from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import json

app = Flask(__name__)
socketio = SocketIO(app)


@socketio.on('python-server-message')
def handle_message(data):
    print(f"Received data from BFF: {data}")

    emit('response_event_name', {
         'response': 'Processed data...'}, broadcast=False)


if __name__ == '__main__':
    with open('env-configs.json', 'r') as file:
        json_data = json.load(file)
        print(json_data)

        socketio.run(app, host='0.0.0.0',
                     port=json_data['ports']['solution-python-server'])
