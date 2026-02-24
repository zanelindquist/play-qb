import os

from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler

from src.socket_events.constructor import socketio

from datetime import timedelta, datetime

from src.db.utils import delete_inactive_lobbies

jwt = JWTManager()


def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)

    # Remove this later-- its just so we can use a different localhost port in development
    # Load environment
    ENV = os.environ.get("ENV", "development")  # default to development
    if ENV == "production":
        allowed_origins = ["https://morequizbowl.com"]
    else:
        allowed_origins = [
            "http://localhost:8081",
            "https://localhost",
            "https://app.localhost",
            "http://10.104.5.175",
            "https://10.104.5.175",
        ]

    CORS(app, resources={r"/*": {"origins": allowed_origins}})
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
    
    # Load JWT securely
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
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
    from src.socket_events import game
    from src.socket_events import lobby
    socketio.init_app(app)

    init_db()

    # TODO: Delete lobbies that have been inactive for more than a week
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        delete_inactive_lobbies,
        'interval',
        minutes=1440,
        next_run_time=datetime.now()
    ) # Every day
    scheduler.start()

    return app