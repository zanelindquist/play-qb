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
    hash = get_jwt_identity()

    stats = get_stats_by_hash(hash)
    
    return stats, 200

@bp.route("/my_account", methods=["GET"])
@jwt_required()
def on_my_account():
    hash = get_jwt_identity()

    account = get_user_by_hash(hash, gentle=False, rel_depths={"created_lobbies": 0, "friends": 0})
    
    del account["password"]

    return account, 200

@bp.route("/set_username", methods=["POST"])
@jwt_required()
def on_set_username():
    hash = get_jwt_identity()
    data = request.get_json()
    
    username = data.get("username")

    result = edit_user(hash, {"username": username})

    return jsonify(result), result.get("code")

@bp.route("/saved", methods=["POST"])
@jwt_required()
def on_saved():
    hash = get_jwt_identity()
    data = request.get_json()

    user = get_user_by_hash(hash)
    
    offset = data.get("offset")
    limit = data.get("limit")
    saved_type = data.get("saved_type")
    category = data.get("category")

    result = get_saved_questions(hash, saved_type=saved_type, category=category, offset=offset, limit=limit)

    return {"questions": result.get("questions"), "user": user, "saved_type": saved_type, "next_offset": offset + limit, "total_length": result.get("total")}, 200

@bp.route("/unsave_question", methods=["POST"])
@jwt_required()
def on_unsave_question():
    hash = get_jwt_identity()
    data = request.get_json()

    result = unsave_question(hash, data.get("hash"))

    return {"message": "Question unsaved"}, 200



# ===== AUTHORIZED ROUTES =====

@bp.route("/identity")
@jwt_required()
def identity():
    hash = get_jwt_identity()
    print(hash)
    return hash, 200

@bp.route("/account")
@jwt_required()
def account():
    hash = get_jwt_identity()

    user = get_user_by_hash(hash)

    print(hash)
    return jsonify(user), 200