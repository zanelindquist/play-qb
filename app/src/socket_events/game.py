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
from .lobby import *

def get_timestamp():
    return int(time.time() * 1000)

GAMEMODES = {
    "solos": {
        "size": 1,
    },
    "duos": {
        "size": 2,
    },
    "trios": {
        "size": 3,
    },
    "squads": {
        "size": 4,
    },
    "5v5": {
        "size": 5,
    },
}

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

    # Make sure the lobby exists
    lobby_data = get_lobby_by_alias(lobby)
    if not lobby_data:
        emit("lobby_not_found")
        return
    
    # TODO: See if the user has permission to enter this lobby (dont let people intrude on private or custom games)

    # Create a player for this lobby (if there isnt one)
    user = get_user_by_email(user_id)
    
    # Add player to lobby in database
    result = user_join_lobby(user_id, lobby)

    # Send GameState to the joining player (if possible)

    # do we echo the requested event type back to the user
    # or do we send it in an event channel that matches
    # the data type of the returning information?
    lobby_data = get_lobby_by_alias(lobby)
    game = get_game_by_lobby_alias(lobby)

    gamemode = lobby_data.get("gamemode").lower()

    request.environ["game_hash"] = game.get("hash")

    # Determine which team this user should be in

    # Add the player scores
    # TODO: put users in the same party
    party_hash = get_party_by_user(user.get("hash"))

    # If there is no party hash, then the user connected directly to the game without going through the lobby.
    # I will allow it because its easy, but we have to make a new party
    if not party_hash:
        party_hash = create_party(user.get("hash"))

    # Team name (if its solos, we want it to be their name)
    team_name = user.get("username") if gamemode == "solos" else None
    # Don't put partied users on the same team if its solos or the number excedes the mode
    party_member_hashes = sorted(list(parties[party_hash]["members"].keys()))
    party_size = len(party_member_hashes)
    if not gamemode or not GAMEMODES.get(gamemode):
        # TODO: Tell them error joining
        return;
    team_size = GAMEMODES.get(gamemode).get("size")
    my_party_number = party_member_hashes.index(user.get("hash"))
    team_hash = f"{party_hash}-{math.floor(my_party_number / team_size)}"
    teams = add_player_to_game_scores(game.get("hash"), user.get("hash"), team_hash=team_hash, team_name=team_name)
    # Now set game again because we just modififed the teams on it
    lobby_data = get_lobby_by_alias(lobby)

    # TODO: Handle lobbies with multiple games
    lobby_data["games"][0]["teams"] = attatch_players_to_teams(teams)

    # Send PlayerInformation about the new player to existing players
    
    emit("you_joined", {"user": user})
    
    emit("player_joined", {"user": user, "lobby": lobby_data}, room=f"lobby:{lobby}")

# When a player buzzes
@socketio.on("buzz", namespace="/game")
def on_buzz(data): # Timestamp, AnswerContent
    lobby = request.environ.get("lobby")
    user_id = request.environ["user_id"]
    game_hash = request.environ.get("game_hash")

    if not game_hash:
        emit("return_to_lobby")
        return;

    if not lobby:
        emit("reconnect")
        return

    # Increment buzzes_encountered for everyone
    result = increment_score_attribute(game_hash, "buzzes_encountered")    

    user = get_user_by_email(user_id)

    # Increment buzzes for just the user
    increment_score_attribute(game_hash, "buzzes", player_hash=user.get("hash"))
    # TODO: Increment for early buzzes

    # TODO: Ajust average time to buzz

    # Broadcast that a player has buzzed
    emit(
        "question_interrupt",
        {"user": user, "answer_content": "", "timestamp": get_timestamp()},
        room=f"lobby:{lobby}"
    )

# When a player is buzzing (every 100 ms or so when typing)
@socketio.on("typing", namespace="/game")
def on_typing(data): # AnswerContent
    lobby = request.environ.get("lobby")
    user_id = request.environ["user_id"]

    if not lobby:
        emit("reconnect")
        return

    answer_content = data.get("content");
    user = get_user_by_email(user_id);

    # Broadcast that a player is typing
    emit(
        "player_typing",
        {"user": user, "answer_content": answer_content},
        room=f"lobby:{lobby}"
    )

# When the player has submitted their final answer
@socketio.on("submit", namespace="/game")
def on_submit(data): # FinalAnswer
    lobby = request.environ.get("lobby")
    user_id = request.environ["user_id"]
    game_hash = request.environ.get("game_hash")

    if not game_hash:
        emit("return_to_lobby")
        return;

    # Logic for determining if an answer is acceptable or not

    # Get lobby's game's current question
    gamestate = get_game_by_lobby_alias(lobby);
    question = gamestate.get("current_question")
    final_answer = data.get("final_answer")
    is_correct = 0
    if not question:
        is_correct = -1
    else:
        is_correct = check_question(question, final_answer) # -1 for incorrect, 0 for prompt, and 1 for correct
    # IsCorrect= math.floor(random.random() * 2) - 1
    user = get_user_by_email(user_id)

    data = {"user": user, "final_answer": final_answer, "is_correct": is_correct, "timestamp": get_timestamp()}

    if is_correct == 1:
        increment_score_attribute(game_hash, "correct", player_hash=user.get("hash"))
        # TODO: Adjust for power
        increment_score_attribute(game_hash, "points", player_hash=user.get("hash"), amount=10)
        
        # Save the question to the user's correct questions if they have premium
        if user.get("premium"):
            save_question(question.get("id"), user.get("id"), category="correct")

        lobby_data = get_lobby_by_alias(lobby)
        data["scores"] = attatch_players_to_teams(lobby_data["games"][0]["teams"])
        # If the answer is true
        # Get question ACCORDING TO LOBBY SETTINGS
        new_question = get_random_question(
            type=0, # Tossup
            level=lobby_data.get("level"), # All, ms, hs, college, open
            category=CATEGORIES[lobby_data.get("category")]
        )

        data["question"] = new_question
        set_question_to_game(new_question, lobby)
        emit("next_question", data, room=f"lobby:{lobby}")
    elif is_correct == 0:
        # If the answer is a prompt, then we want to emit another buzz
        # Emit a resume and then emit another buzz
        emit("question_resume", data, room=f"lobby:{lobby}")
        emit(
            "question_interrupt",
            {"user": user, "answer_content": final_answer, "timestamp": get_timestamp()},
            room=f"lobby:{lobby}"
        )
        
    elif is_correct == -1:
        increment_score_attribute(game_hash, "incorrect", player_hash=user.get("hash"))
        # TODO: Only do neg if the question is not over
        increment_score_attribute(game_hash, "points", player_hash=user.get("hash"), amount=-5)

        # Save the question to the user's missed questions
        if user.get("premium"):
            save_question(question.get("id"), user.get("id"), category="missed")
        
        lobby_data = get_lobby_by_alias(lobby)
        data["scores"] = attatch_players_to_teams(lobby_data["games"][0]["teams"])
        # If the answer is false
        emit("question_resume", data, room=f"lobby:{lobby}")

@socketio.on("change_game_settings", "/game")
def on_change_game_settings(data):
    user_id = request.environ["user_id"]
    lobby = request.environ.get("lobby")
    user = get_user_by_email(user_id)

    # Early request from the front end from race condition, not intentional, but we have to guard against it
    if not lobby:
        return;

    settings = data.get("settings")

    if not lobby:
        return;

    if not settings:
        emit("changed_game_settings_failure", {"message": "No settings provided", "code": 400})
        return;

    # TODO: see if the user can edit the settings

    # Change lobby settings
    result = set_lobby_settings(lobby, settings)

    if result.get("code") >= 400:
        emit("changed_game_settings_failure", {"message": "An error occurred", "error": result.get("error"), "code": 500})
        return;

    lobby_data = get_lobby_by_alias(lobby)

    # TODO: Handle lobbies with multiple games
    lobby_data["games"][0]["teams"] = attatch_players_to_teams(lobby_data["games"][0]["teams"])
    
    emit("changed_game_settings", {"lobby": lobby_data}, room=f"lobby:{lobby}")

# PAUSING AND PLAYING THE GAME

@socketio.on("next_question", namespace="/game")
def on_next_question(data):
    lobby = request.environ.get("lobby")
    user_id = request.environ["user_id"]
    game_hash = request.environ.get("game_hash")

    if not game_hash:
        emit("return_to_lobby")
        return;

    if not game_hash:
        emit("return_to_lobby")
        return;

    if not lobby:
        emit("reconnect")
        return

    # TODO: See if player has authority to skip question

    # Increment buzzes_encountered
    result = increment_score_attribute(game_hash, "questions_encountered")

    lobby_data = get_lobby_by_alias(lobby)

    # Get question ACCORDING TO LOBBY SETTINGS
    question = get_random_question(
        type=0, # Tossup
        level=lobby_data.get("level"), # All, ms, hs, college, open
        category=CATEGORIES[lobby_data.get("category")]
    )

    # Set this question as the game's question
    set_question_to_game(question, lobby)

    emit("next_question", {"question": question, "timestamp": get_timestamp()}, room=f"lobby:{lobby}")

# Occurs only when the game in unpaused
@socketio.on("game_resume", namespace="/game")
def on_game_resume(): # Empty
    lobby = request.environ.get("lobby")
    user_id = request.environ["user_id"]

    user = get_user_by_email(user_id)

    emit("game_resumed", {"user": user, "timestamp": get_timestamp()}, room=f"lobby:{lobby}")

# Occurs only when a player pauses the game
@socketio.on("game_pause", namespace="/game")
def on_game_pause(): # Empty
    lobby = request.environ.get("lobby")
    user_id = request.environ["user_id"]

    user = get_user_by_email(user_id)

    emit("game_pause", {"user": user}, room=f"lobby:{lobby}")

@socketio.on("disconnect", namespace="/game")
def on_disconnect():
    user_id = request.environ["user_id"]
    lobby = request.environ.get("lobby")

    print(f"Received disconnect from /game {user_id}")

    user = get_user_by_email(user_id)

    # Add the scores to the user's stats
    stats = remove_user_game_scores(user.get("current_game").get("hash"), user.get("hash"))

    total_stats = write_user_stats(user.get("hash"), stats)

    lobby_data = get_lobby_by_alias(lobby)

    # TODO: Handle lobbies with multiple games
    lobby_data["games"][0]["teams"] = attatch_players_to_teams(lobby_data["games"][0]["teams"])

    # Give them their stats before they are disconnected
    emit("you_disconnected", {"stats": stats, "total_stats": total_stats})

    result = user_disconnect_from_lobby(user_id)

    emit("player_disconnected", {"lobby": lobby_data, "user": user}, room=f"lobby:{lobby}")