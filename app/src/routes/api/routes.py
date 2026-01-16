from flask import Flask, request, jsonify, Blueprint, current_app, make_response
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity
)
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

from src.db.utils import*

bp = Blueprint('api', __name__, url_prefix='/api/v1')

# ===== CLASSIFYING QUESTIONS FOR TRAINING =====
@bp.route("/classify_next", methods=["GET"])
@jwt_required()
def on_classify_next():
    question = get_random_question(hand_labeled=True)

    if question.get("error"):
        return question
    
    return question, 200

@bp.route("/classify_question", methods=["POST"])
@jwt_required()
def on_classify_question():
    data = request.get_json()

    result = classify_question(data.get("hash"), data.get("category"))
    
    return result, result.get("code")


# ===== OTHER PAGES =====

@bp.route("/my_stats", methods=["GET"])
@jwt_required()
def on_my_stats():
    email = get_jwt_identity()

    stats = get_stats_by_email(email)
    
    return stats, 200



# ===== AUTHORIZED ROUTES =====

@bp.route("/identity")
@jwt_required()
def identity():
    email = get_jwt_identity()
    print(email)
    return email, 200

@bp.route("/account")
@jwt_required()
def account():
    email = get_jwt_identity()

    user = get_user_by_email(email)

    print(email)
    return jsonify(user), 200