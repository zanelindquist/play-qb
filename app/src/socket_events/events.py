from flask_socketio import emit, disconnect, join_room, leave_room
from flask import request, session
from flask_jwt_extended import decode_token

from src.db.utils import *
from .constructor import socketio

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
    lobby = data.get("lobbyAlias")
    session["lobby"] = lobby
    join_room(f"lobby:{lobby}")

    if not lobby:
        emit("lobby_not_found", {"message": "Cannot find target lobby", "code": 404})
        return;

    # Add player to lobby in database
    
    # Send GameState to the joining player (if possible)

    # do we echo the requested event type back to the user
    # or do we send it in an event channel that matches
    # the data type of the returning information?
    GameState = {}

    emit("you_joined", {})
    # Send PlayerInformation about the new player to existing players
    
    Player = {}
    
    emit("player_joined", {}, room=f"lobby:{lobby}")

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
        {"Player": user_id, "AnswerContent": ""},
        room=f"lobby:{lobby}"
    )

# When a player is buzzing (every 100 ms or so when typing)
@socketio.on("typing")
def on_typing(data): # AnswerContent
    lobby = session["lobby"]
    user_id = session["user_id"]

    AnswerContent = data.get("content");
    Player = False;

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
    Player, FinalAnswer, Scores, IsCorrect, Question= False


    # If the answer is false
    emit("question_resume", {Player, FinalAnswer, Scores, IsCorrect}, room=f"lobby:{lobby}")

    # If the answer is true
    emit("next_question", {Player, FinalAnswer, Scores, IsCorrect, Question}, room=f"lobby:{lobby}")

# PAUSING AND PLAYING THE GAME

# Occurs only when the game in unpaused
@socketio.on("game_resume")
def on_question_resume(): # Empty
    lobby = session["lobby"]
    user_id = session["user_id"]

    Player = False;

    emit("game_resume", {Player}, room=f"lobby:{lobby}")

# Occurs only when a player pauses the game
@socketio.on("game_pause")
def on_question_resume(): # Empty
    lobby = session["lobby"]
    user_id = session["user_id"]

    Player = False;

    emit("game_pause", {Player}, room=f"lobby:{lobby}")
