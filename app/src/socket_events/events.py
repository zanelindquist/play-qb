from flask_socketio import emit, disconnect, join_room, leave_room
from flask import request, session
from flask_jwt_extended import decode_token

import time

from src.db.utils import *
from .constructor import socketio

def get_timestamp():
    return int(time.time() * 1000)

# ===== INCOMMING EVENT HANDLERS =====

# On connect we will need to get the auth token of the user so that we can know their identity
@socketio.on("connect")
def connect(auth):
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
    
    session["user_id"] = identity;
    print(f"Socket connected: user={identity}")

# When a player joins the lobby
@socketio.on("join_lobby")
def on_join_lobby(data):
    user_id = session["user_id"]
    lobby = data.get("lobbyAlias")
    session["lobby"] = lobby
    join_room(f"lobby:{lobby}")

    if not lobby:
        emit("lobby_not_found", {"message": "Cannot find target lobby", "code": 404})
        return;

    # Create lobby (if its not there)
    create_lobby(lobby)

    # Create a player for this lobby (if there isnt one)
    create_player(user_id, lobby)

    # Add player to lobby in database
    player_join_lobby(user_id, lobby)

    # Send GameState to the joining player (if possible)

    # do we echo the requested event type back to the user
    # or do we send it in an event channel that matches
    # the data type of the returning information?
    GameState = {}

    # Send PlayerInformation about the new player to existing players
    
    Player = get_player_by_email_and_lobby(user_id, lobby)
    
    emit("player_joined", {"Player": Player}, room=f"lobby:{lobby}")

# When a player buzzes
@socketio.on("buzz")
def on_buzz(data): # Timestamp, AnswerContent
    lobby = session["lobby"]
    user_id = session["user_id"]

    print(user_id)
    print(lobby)

    # Broadcast that a player has buzzed
    emit(
        "question_interrupt",
        {"Player": user_id, "AnswerContent": "", "Timestamp": get_timestamp()},
        room=f"lobby:{lobby}"
    )

# When a player is buzzing (every 100 ms or so when typing)
@socketio.on("typing")
def on_typing(data): # AnswerContent
    lobby = session["lobby"]
    user_id = session["user_id"]

    AnswerContent = data.get("content");
    Player = get_player_by_email_and_lobby(user_id, lobby);

    # Broadcast that a player is typing
    emit(
        "player_typing",
        {"Player": Player, "AnswerContent": AnswerContent},
        room=f"lobby:{lobby}"
    )

# When the player has submitted their final answer
@socketio.on("submit")
def on_submit(data): # FinalAnswer
    lobby = session["lobby"]
    user_id = session["user_id"]

    # Logic for determining if an answer is acceptable or not

    IsCorrect = False
    FinalAnswer = data.get("FinalAnswer")
    Scores = False
    Player = get_player_by_email_and_lobby(user_id, lobby)

    data = {"Player": Player, "FinalAnswer": FinalAnswer, "Scores": Scores, "IsCorrect": IsCorrect, "Timestamp": get_timestamp()}

    if IsCorrect:
        # If the answer is true
        # Get question according to game settings
        data["Question"] = get_random_question()
        emit("next_question", data, room=f"lobby:{lobby}")
    else:
        # If the answer is false
        emit("question_resume", data, room=f"lobby:{lobby}")

# PAUSING AND PLAYING THE GAME

@socketio.on("next_question")
def on_next_question(data):
    lobby = session["lobby"]
    user_id = session["user_id"]

    # See if player has authority to skip question

    # Get question ACCORDING TO LOBBY SETTINGS
    Question = get_random_question()
    emit("next_question", {"Question": Question, "Timestamp": get_timestamp()}, room=f"lobby:{lobby}")

# Occurs only when the game in unpaused
@socketio.on("game_resume")
def on_game_resume(): # Empty
    lobby = session["lobby"]
    user_id = session["user_id"]

    Player = get_player_by_email_and_lobby(user_id, lobby)

    emit("game_resumed", {"Player": Player, "Timestamp": get_timestamp()}, room=f"lobby:{lobby}")

# Occurs only when a player pauses the game
@socketio.on("game_pause")
def on_game_pause(): # Empty
    lobby = session["lobby"]
    user_id = session["user_id"]

    Player = False;

    emit("game_pause", {Player}, room=f"lobby:{lobby}")
