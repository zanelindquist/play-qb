from .constructor import socketio
from flask_socketio import emit

@socketio.on("connect")
def on_connect():
    print("Client connected")
    emit("server_message", {"msg": "Hello from Flask!"})

@socketio.on("chat_message")
def handle_chat_message(data):
    print("Message received:", data)
    emit("chat_message", data, broadcast=True)
