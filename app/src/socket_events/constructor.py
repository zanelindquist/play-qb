from flask import Flask
from flask_socketio import SocketIO

socketio = SocketIO(
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False
)
