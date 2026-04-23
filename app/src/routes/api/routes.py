from flask import Flask, request, jsonify, Blueprint, current_app, make_response
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity
)
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

from src.db.utils import*
from src.services.leaderboard import leaderboard_cache

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

    return 404

    result = classify_question(data.get("hash"), data.get("category"))
    
    return result, result.get("code")


# ===== OTHER PAGES =====

@bp.route("/my_stats", methods=["GET"])
@jwt_required()
def on_my_stats():
    hash = get_jwt_identity()

    stats = get_stats_by_hash(hash)

    if not stats:
        return None, 404
    
    return stats, 200

@bp.route("/my_account", methods=["GET"])
@jwt_required()
def on_my_account():
    hash = get_jwt_identity()

    if not hash:
        return None, 404

    account = get_user_by_hash(hash, gentle=False, rel_depths={"created_lobbies": 0, "friends": 0})
    
    if account:
        del account["password"]
    else:
        return None, 404

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

    if not user:
        return None, 404
    
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

@bp.route("/leaderboard", methods=["GET"])
@jwt_required()
def on_leaderboard():
    """
    Get ranked leaderboard with optional user rank information.
    
    Query Parameters:
        category: "global" or category name (default: "global")
        limit: Number of rows to return (default: 20)
        offset: Pagination offset (default: 0)
        include_user_rank: Include user's rank info (default: false)
    """
    hash = get_jwt_identity()
    
    category = request.args.get("category", "global")
    limit = request.args.get("limit", 20, type=int)
    offset = request.args.get("offset", 0, type=int)
    include_user_rank = request.args.get("include_user_rank", "false").lower() == "true"
    
    # Validate inputs
    if limit < 1 or limit > 100:
        limit = 20
    if offset < 0:
        offset = 0
    
    try:
        leaderboard = leaderboard_cache.get_leaderboard(
            category=category,
            limit=limit,
            offset=offset,
            include_user_rank=include_user_rank,
            user_hash=hash if include_user_rank else None
        )
        return leaderboard, 200
    except Exception as e:
        print(f"Error fetching leaderboard: {e}")
        return {"error": "Failed to fetch leaderboard", "code": 500}, 500



# ===== AUTHORIZED ROUTES =====

@bp.route("/identity")
@jwt_required()
def identity():
    hash = get_jwt_identity()

    return hash, 200

# Premium
@bp.route("/get_premium", methods=["POST"])
@jwt_required()
def get_premium():
    hash = get_jwt_identity()
    data = request.get_json()

    code = data.get("code")

    result = set_premium(hash, code)

    return result, result.get("code")

# Fetch wikipedia info
@bp.route("/fetch_wiki", methods=["GET"])
@jwt_required()
def fetch_wiki():
    answer = request.args.get("answer")
    category = request.args.get("category")
    question_hash = request.args.get("h")

    result = wiki_service.fetch_single(answer, category, question_hash)

    if result:
        return result, 200
    else:
        return None, 404