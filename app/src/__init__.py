import os

from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
# from apscheduler.schedulers.background import BackgroundScheduler

from src.socket_events.constructor import socketio

from datetime import timedelta

jwt = JWTManager()


def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)

    # Remove this later-- its just so we can use a different localhost port in development
    CORS(app, resources={r"/*": {"origins": "https://localhost"}}, origins=["https://app.localhost"])

    app.config.from_mapping(
        SECRET_KEY='dev',
        DATABASE=os.path.join(app.instance_path, 'flaskr.sqlite'),
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    # Initialize JWT with the app
    app.config["JWT_SECRET_KEY"] = "abcdefghijklmnopqrstuvwxyz1234567890"
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=2)

    from src.db.utils import Session

    # Make sure our Session factory closes when the app stops
    @app.teardown_appcontext
    def remove_session(exception=None):
        Session.remove()
    
    jwt.init_app(app)

    # Register blueprints
    from .routes.api import routes as api_routes
    from .routes.auth import routes as auth_routes

    app.register_blueprint(api_routes.bp)
    app.register_blueprint(auth_routes.bp)

    from .db.db import init_db

    # Register socket
    # from socket_events import events
    socketio.init_app(app)

    init_db()

    return app