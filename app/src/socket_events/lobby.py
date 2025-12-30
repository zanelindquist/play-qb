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

    print(f"Socket connected to /lobby: user={identity}")

# This is where we get information about a lobby
@socketio.on("enter_lobby", "/lobby")
def on_enter_lobby(data):
    user_id = request.environ["user_id"]
    lobby = data.get("lobbyAlias")
    request.environ["prelobby"] = lobby
    join_room(f"prelobby:{lobby}")

    print("ENTER LOBBY")

    if not lobby:
        emit("prelobby_not_found", {"message": "Cannot find target lobby", "code": 404})
        return;

    # Get the number of current players in the lobby
    lobby_data = get_lobby_by_alias(lobby)

    print("LOBBY", lobby_data)

    if not lobby_data:
        emit("prelobby_not_found", {"message": "Cannot find target lobby", "code": 404})
        return;

    # Tell this player's friends what gamemode they are now in

    # Give the player their information (load profiles, ect)
    Player = get_player_by_email_and_lobby(user_id, lobby)

    print("PLAYER", Player)

    emit("prelobby_joined", {"Player": Player, "Lobby": lobby_data})

@socketio.on("search_friends", "/lobby")
def on_find_friends(data):
    user_id = request.environ["user_id"]
    lobby = request.environ["prelobby"]

    query = data.get("query")

    friends = get_friends_by_email(user_id)

    # Apply the query
    friends = search_filter(friends, ["firstname", "lastname"], query)


    emit("friends_found", {"friends": friends})