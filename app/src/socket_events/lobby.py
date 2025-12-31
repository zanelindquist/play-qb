"""
    This file is for the lobby namespace of the sockets.
    It relates to finding a game, inviting friends, and party events
"""

from flask_socketio import emit, disconnect, join_room, leave_room
from flask import request, session
from flask_jwt_extended import decode_token

import time

from src.db.utils import *
from .constructor import socketio

def get_timestamp():
    return int(time.time() * 1000)

# ===== INCOMMING EVENT HANDLERS =====

@socketio.on("connect", "/lobby")
def on_connect(auth):
    token = auth.get("token")

    if not token:
        print("No token provided")
        emit("failed_connection", {"message": "No token provided", "code": 400})
        disconnect()
        return
    
    try:
        decoded = decode_token(token)
        identity = decoded.get("sub")
    except Exception as e:
        print("Invalid token")
        emit("failed_connection", {"message": "Invalid token", "code": 401})
        return
    
    request.environ["user_id"] = identity;

    user = get_user_by_email(identity)

    join_room(f"user:{user.get("hash")}")

    print(f"Socket connected to /lobby: user={identity}")

@socketio.on("disconnect", "/lobby")
def on_disconnect():
    user_id = request.environ.get("user_id")
    lobby = request.environ.get("lobby")

    print(f"Received disconnect form {user_id}")

    set_user_online(user_id, False)

    emit("user_disconnected")

# This is where we get information about a lobby
@socketio.on("enter_lobby", "/lobby")
def on_enter_lobby(data):
    user_id = request.environ["user_id"]
    lobby = data.get("lobbyAlias")
    request.environ["prelobby"] = lobby
    join_room(f"prelobby:{lobby}")

    if not lobby:
        emit("prelobby_not_found", {"message": "Cannot find target lobby", "code": 404})
        return;

    # Get the number of current players in the lobby
    lobby_data = get_lobby_by_alias(lobby)

    if not lobby_data:
        emit("prelobby_not_found", {"message": "Cannot find target lobby", "code": 404})
        return;

    # Tell this player's friends what gamemode they are now in

    # Give the player their information (load profiles, ect)
    Player = get_player_by_email_and_lobby(user_id, lobby)
    User = get_user_by_email(user_id)

    set_user_online(user_id, True)

    emit("prelobby_joined", {"Player": Player, "User": User, "Lobby": lobby_data})

@socketio.on("search_friends", "/lobby")
def on_search_friends(data):
    user_id = request.environ["user_id"]
    lobby = request.environ["prelobby"]

    query = data.get("query")

    friends = get_friends_by_email(user_id, True)

    # Apply the query
    friends = search_filter(friends, ["firstname", "lastname"], query)

    emit("friends_found", {"friends": friends})

@socketio.on("invite_friend", "/lobby")
def on_add_friend(data):
    user_id = request.environ["user_id"]
    lobby = request.environ["prelobby"]

    hash = data.get("hash")

    if not hash:
        emit("invite_friend", {"message": "add_friend(): hash not provided", "code": 400})
        return
    
    inviter = get_user_by_email(user_id)

    emit("invited", {"from_user": inviter}, room=f"user:{hash}")

@socketio.on("search_users", "/lobby")
def on_search_users(data):
    user_id = request.environ["user_id"]
    lobby = request.environ["prelobby"]

    query = data.get("query")
    if not query:
        emit("users_found", {"users": []})
        return

    users = get_users_by_query(query)

    emit("users_found", {"users": users})

@socketio.on("add_friend", "/lobby")
def on_add_friend(data):
    user_id = request.environ["user_id"]
    lobby = request.environ["prelobby"]

    hash = data.get("hash")

    print(hash)

    if not hash:
        emit("added_friend", {"message": "add_friend(): hash not provided", "code": 400})
        return

    result = create_friend_request_from_email_to_hash(user_id, hash)

    emit("added_friend", result)