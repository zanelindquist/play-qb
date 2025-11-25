from flask import Flask, request, jsonify, Blueprint, current_app, make_response
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity
)
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

from ...db.utils import *

bp = Blueprint('api', __name__, url_prefix='/api/v1')


@bp.route("/random_question", methods=["GET"])
def random_question():
    question = get_random_question()
    if question.get("error"):
        return question
    
    return question, 200