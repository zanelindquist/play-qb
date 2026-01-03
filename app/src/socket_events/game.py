"""
    This file is for the game namespace of the sockets.
    It handles events that are directly related to playing the game
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

# On connect we will need to get the auth token of the user so that we can know their identity
@socketio.on("connect", namespace="/game")
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
    
    request.environ["user_id"] = identity;

    print(f"Socket connected to /game: user={identity}")

# When a player joins the lobby
@socketio.on("join_lobby", namespace="/game")
def on_join_lobby(data):
    user_id = request.environ["user_id"]
    lobby = data.get("lobbyAlias")
    request.environ["lobby"] = lobby
    join_room(f"lobby:{lobby}")

    if not lobby:
        emit("lobby_not_found", {"message": "Cannot find target lobby", "code": 404})
        return;

    # Create lobby (if its not there)
    create_lobby({"name": lobby})

    # Create a player for this lobby (if there isnt one)
    create_player(user_id, lobby)

    # Add player to lobby in database
    result = player_join_lobby(user_id, lobby)

    print("join", result)

    # Send GameState to the joining player (if possible)

    # do we echo the requested event type back to the user
    # or do we send it in an event channel that matches
    # the data type of the returning information?
    game_state = get_gamestate_by_lobby_alias(lobby)

    # Send PlayerInformation about the new player to existing players
    
    player = get_player_by_email_and_lobby(user_id, lobby)

    lobby_data = get_lobby_by_alias(lobby)

    emit("you_joined", {"player": player, "game_state": game_state, "lobby": lobby_data})
    
    emit("player_joined", {"player": player}, room=f"lobby:{lobby}")

# When a player buzzes
@socketio.on("buzz", namespace="/game")
def on_buzz(data): # Timestamp, AnswerContent
    lobby = request.environ.get("lobby")
    user_id = request.environ["user_id"]

    if not lobby:
        emit("reconnect")
        return

    player = get_player_by_email_and_lobby(user_id, lobby)

    # Broadcast that a player has buzzed
    emit(
        "question_interrupt",
        {"player": player, "answer_content": "", "timestamp": get_timestamp()},
        room=f"lobby:{lobby}"
    )

# When a player is buzzing (every 100 ms or so when typing)
@socketio.on("typing", namespace="/game")
def on_typing(data): # AnswerContent
    lobby = request.environ["lobby"]
    user_id = request.environ["user_id"]

    if not lobby:
        emit("reconnect")
        return

    answer_content = data.get("content");
    player = get_player_by_email_and_lobby(user_id, lobby, rel_depths={});

    # Broadcast that a player is typing
    emit(
        "player_typing",
        {"player": player, "answer_content": answer_content},
        room=f"lobby:{lobby}"
    )

# When the player has submitted their final answer
@socketio.on("submit", namespace="/game")
def on_submit(data): # FinalAnswer
    lobby = request.environ["lobby"]
    user_id = request.environ["user_id"]

    # Logic for determining if an answer is acceptable or not

    # Get lobby's game's current question
    gamestate = get_gamestate_by_lobby_alias(lobby);
    question = gamestate.get("current_question")
    final_answer = data.get("final_answer")
    is_correct = check_question(question, final_answer) # -1 for incorrect, 0 for prompt, and 1 for correct
    # IsCorrect= math.floor(random.random() * 2) - 1
    scores = False
    player = get_player_by_email_and_lobby(user_id, lobby)

    data = {"player": player, "final_answer": final_answer, "scores": scores, "is_correct": is_correct, "timestamp": get_timestamp()}

    if is_correct == 1:
        # If the answer is true
        # Get question according to game settings
        new_question = get_random_question(confidence_threshold=0)
        data["question"] = new_question
        set_question_to_game(new_question, lobby)
        emit("next_question", data, room=f"lobby:{lobby}")
    elif is_correct == 0:
        # If the answer is a prompt, then we want to emit another buzz
        # Emit a resume and then emit another buzz
        emit("question_resume", data, room=f"lobby:{lobby}")
        emit(
            "question_interrupt",
            {"player": player, "answer_content": "", "timestamp": get_timestamp()},
            room=f"lobby:{lobby}"
        )
        
    elif is_correct == -1:
        # If the answer is false
        emit("question_resume", data, room=f"lobby:{lobby}")

# PAUSING AND PLAYING THE GAME

@socketio.on("next_question", namespace="/game")
def on_next_question(data):
    lobby = request.environ.get("lobby")
    user_id = request.environ["user_id"]

    if not lobby:
        emit("reconnect")
        return

    # See if player has authority to skip question

    # Get question ACCORDING TO LOBBY SETTINGS
    question = get_random_question(type=0)
    # Set this question as the game's question
    set_question_to_game(question, lobby)
    emit("next_question", {"question": question, "timestamp": get_timestamp()}, room=f"lobby:{lobby}")

# Occurs only when the game in unpaused
@socketio.on("game_resume", namespace="/game")
def on_game_resume(): # Empty
    lobby = request.environ["lobby"]
    user_id = request.environ["user_id"]

    player = get_player_by_email_and_lobby(user_id, lobby)

    emit("game_resumed", {"player": player, "timestamp": get_timestamp()}, room=f"lobby:{lobby}")

# Occurs only when a player pauses the game
@socketio.on("game_pause", namespace="/game")
def on_game_pause(): # Empty
    lobby = request.environ["lobby"]
    user_id = request.environ["user_id"]

    player = False;

    emit("game_pause", {player}, room=f"lobby:{lobby}")

@socketio.on("disconnect", namespace="/game")
def on_disconnect():
    user_id = request.environ.get("user_id")
    lobby = request.environ.get("lobby")

    print(f"Received disconnect form {user_id}")

    result = player_disconnect_from_lobby(user_id, lobby)

    emit("player_disconnected", room=f"lobby:{lobby}")