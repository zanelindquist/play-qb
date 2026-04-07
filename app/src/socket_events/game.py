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
import src.socket_events.state_management.game_state as game_mem

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
    "ranked": {
        "size": 1,
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
        user_hash = decoded.get("sub")
    except Exception as e:
        print("Invalid token")
        emit("failed_connection", {"message": "Invalid token", "code": 401})
        return
    
    # Set the user_hash as the hash instead

    request.environ["user_hash"] = user_hash;

    # Put the user in their own room
    join_room(f"user:{user_hash}")

    print(f"Socket connected to /game: user={user_hash}")

# When a player joins the lobby
@socketio.on("join_lobby", namespace="/game")
def on_join_lobby(data):
    user_hash = request.environ.get("user_hash")
    if not user_hash:
        emit("failed_connection", {"message": "User does not exist", "code": 404})
        return;
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

    user = get_user_by_hash(user_hash, rel_depths={"stats": 0})
    
    # Add player to lobby in database
    result = user_join_lobby(user_hash, lobby)

    # Send GameState to the joining player (if possible)

    # do we echo the requested event type back to the user
    # or do we send it in an event channel that matches
    # the data type of the returning information?
    lobby_data = get_lobby_by_alias(lobby)
    game = get_game_by_lobby_alias(lobby)

    if not game:
        emit("game_not_found")
        return

    # See if we should update the game active_at while we're at it
    update_game_active_at(game.get("hash"), game.get("active_at"))

    mem_game = game_mem.create_game_memory_instance(game.get("hash"), {"total_rounds": game.get("rounds"), "lobby_settings": lobby_data})

    # Add the user to the game
    game_mem.add_user_to_game(user, game.get("hash"))

    gamemode = lobby_data.get("gamemode").lower()

    request.environ["game_hash"] = game.get("hash")

    # Set these in a session so that we can use them on disconnect
    session["user_hash"] = user_hash
    session["lobby"] = lobby
    session["game_hash"] = game.get("hash")

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

    # Attatch the user's ranked info
    skill = ranked.Skill(user.get("stats").get("skill_mu"), user.get("stats").get("skill_sigma"))
    user["rank"] = ranked.get_rank(skill).to_dict()

    # Send the joiner their own user object and the current game state
    emit("you_joined", {"user": user})
    emit(
        "game_state",
        {
            "user": user,
            "lobby": lobby_data,
            "timestamp": get_timestamp(),
            "game_state": {
                "current_question": mem_game.get("current_question"),
                "question_state": mem_game.get("question_state"),
                "question_interrupts": mem_game.get("question_interrupts"),
                "question_count": mem_game.get("question_count"),
                "total_rounds": mem_game.get("total_rounds"),
            },
        }
    )
    
    emit("player_joined", {"user": user, "lobby": lobby_data}, room=f"lobby:{lobby}")

@socketio.on("change_game_settings", "/game")
def on_change_game_settings(data):
    user_hash = request.environ.get("user_hash")
    if not user_hash:
        emit("failed_connection", {"message": "User does not exist", "code": 404})
        return;
    lobby = request.environ.get("lobby")
    user = get_user_by_hash(user_hash)

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
    result = set_lobby_settings(lobby, settings, user)

    if result.get("code") >= 400:
        emit("changed_game_settings_failure", {"message": "An error occurred", "error": result.get("error"), "code": 500})
        return;

    lobby_data = get_lobby_by_alias(lobby)

    # TODO: Handle lobbies with multiple games
    lobby_data["games"][0]["teams"] = attatch_players_to_teams(lobby_data["games"][0]["teams"])
    
    emit("changed_game_settings", {"lobby": lobby_data}, room=f"lobby:{lobby}")


# When a player buzzes
@socketio.on("buzz", namespace="/game")
def on_buzz(data): # Timestamp, AnswerContent
    lobby = request.environ.get("lobby")
    user_hash = request.environ.get("user_hash")
    if not user_hash:
        emit("failed_connection", {"message": "User does not exist", "code": 404})
        return;
    game_hash = request.environ.get("game_hash")

    if not game_hash:
        emit("return_to_lobby")
        return;

    if not lobby:
        emit("reconnect")
        return
    
    user = get_user_by_hash(user_hash, rel_depths={"stats": 0})

    game_m = game_mem.get_game(game_hash)

    if not game_m.get("current_question"):
        return
    
    # Enforce multiple buzzing
    if not game_m["lobby_settings"]["allow_multiple_buzz"] and user_hash in [interrupt["user"]["hash"] for interrupt in game_m["question_interrupts"]]:
        return;

    question_state = data.get("question_state")
    character_buzz = data.get("after_character")

    # If this is the first buzz, then 
    if len(game_m.get("question_interrupts")) == 0:
        # Increment buzzes_encountered for everyone in the room
        increment_score_attribute(game_hash, "buzzes_encountered")

    if question_state == "running":
        increment_score_attribute(game_hash, "early", player_hash=user_hash)

    # Buzz into memory
    interrupt = game_mem.start_interrupt(user, game_hash, after_character=character_buzz)

    # TODO: Ajust average time to buzz
    proportion_to_buzz = character_buzz / len(game_m["current_question"]["question"])

    buzz_time_change = (proportion_to_buzz - user.get("stats").get("average_time_to_buzz")) / (user.get("stats").get("buzzes") + 1)

    # mu n+1 = (x - mu) / (n + 1)
    increment_score_attribute(
        game_hash,
        "average_time_to_buzz",
        player_hash=user_hash,
        amount=buzz_time_change
    )

    # Increment buzzes for just the user
    increment_score_attribute(game_hash, "buzzes", player_hash=user_hash)

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
    user_hash = request.environ.get("user_hash")
    if not user_hash:
        emit("failed_connection", {"message": "User does not exist", "code": 404})
        return;

    if not lobby:
        emit("reconnect")
        return

    answer_content = data.get("content");
    user = get_user_by_hash(user_hash);

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
    user_hash = request.environ.get("user_hash")
    if not user_hash:
        emit("failed_connection", {"message": "User does not exist", "code": 404})
        return;
    game_hash = request.environ.get("game_hash")

    if not game_hash:
        emit("return_to_lobby")
        return;

    # Logic for determining if an answer is acceptable or not

    # Get lobby's game's current question
    game = get_game_by_hash(game_hash)
    question = game.get("current_question")
    final_answer = data.get("final_answer")

    is_correct = 0
    if not question or not final_answer:
        is_correct = -1
    else:
        is_correct = check_question(question, final_answer) # -1 for incorrect, 0 for prompt, and 1 for correct
    
    user = get_user_by_hash(user_hash)

    interrupt = game_mem.submit_interrupt(user_hash, game_hash, is_correct=is_correct)

    is_early = interrupt.get("is_early")

    data = {"user": user, "final_answer": final_answer, "is_correct": is_correct, "timestamp": get_timestamp()}

    # TODO update telling if a lobby is ranked
    rank_change_information = None
    if lobby == "ranked":
        result = update_rank(user_hash, question, is_correct, interrupt.get("proportion_through"))
        rank_change_information = result.get("user")

        # If the user got the question correct, then let's give them a rank changed event
        if is_correct:
            emit("rank_changed", rank_change_information)

    if is_correct == 1:
        increment_score_attribute(game_hash, "correct", player_hash=user.get("hash"))
        # Update if its power
        if interrupt.get("is_power"):
            increment_score_attribute(game_hash, "power", player_hash=user.get("hash"))
            increment_score_attribute(game_hash, "points", player_hash=user.get("hash"), amount=15)
            emit("reward_points", {"points": 15})
        else:
            increment_score_attribute(game_hash, "points", player_hash=user.get("hash"), amount=10)
            emit("reward_points", {"points": 10})
        
        # Save the question to the user's correct questions if they have premium
        if user.get("premium"):
            save_question(question.get("id"), user.get("id"), saved_type="correct")

        # Run next question code

        lobby_data = get_lobby_by_alias(lobby)
        data["scores"] = attatch_players_to_teams(lobby_data["games"][0]["teams"])
        
        # Get question ACCORDING TO LOBBY SETTINGS
        new_question = get_random_question(
            type=0, # Tossup
            difficulty=lobby_data.get("level"),
            category=CATEGORIES[lobby_data.get("category")], # Convert category number to string
            tournament=lobby_data.get("tournament", "all") # No tournament setting yet
        )

        data["question"] = new_question

        game_m = game_mem.get_game(game_hash)

        # If the lobby is ranked, then we want to adjust user rank for users who don't answer a question
        #TODO: tell if lobby is ranked
        if lobby == "ranked" and game_m.get("current_question"):
            ranked_on_next_question(game_m, emit)

        game_mem.set_question_state(game_hash, "waiting")
        game_mem.next_question(new_question, game_hash)

        # Set this question as the game's DB question
        set_question_to_game(new_question, lobby)

        emit("next_question", data, room=f"lobby:{lobby}")

    elif is_correct == 0:
        # If the answer is a prompt, then we want to emit another buzz
        # Emit a resume and then emit another buzz
        # Add a new interrupt
        interrupt = game_mem.start_interrupt(user, game_hash, after_character=interrupt.get("after_character"))
        
        emit("question_resume", data, room=f"lobby:{lobby}")
        emit(
            "question_interrupt",
            {"user": user, "answer_content": final_answer, "timestamp": get_timestamp()},
            room=f"lobby:{lobby}"
        )
        game_mem.set_question_state(game_hash, "running")
        
    elif is_correct == -1:
        increment_score_attribute(game_hash, "incorrect", player_hash=user.get("hash"))
        if is_early:
            increment_score_attribute(game_hash, "points", player_hash=user.get("hash"), amount=-5)

        # Save the question to the user's missed questions
        if user.get("premium"):
            save_question(question.get("id"), user.get("id"), saved_type="missed")
        
        lobby_data = get_lobby_by_alias(lobby)
        data["scores"] = attatch_players_to_teams(lobby_data["games"][0]["teams"])
        # If the answer is false
        emit("question_resume", data, room=f"lobby:{lobby}")
        game_mem.set_question_state(game_hash, "running")

# PAUSING AND PLAYING THE GAME

@socketio.on("next_question", namespace="/game")
def on_next_question(data):
    lobby = request.environ.get("lobby")
    user_hash = request.environ.get("user_hash")
    if not user_hash:
        emit("failed_connection", {"message": "User does not exist", "code": 404})
        return;
    game_hash = request.environ.get("game_hash")

    if not game_hash:
        emit("return_to_lobby")
        return;

    if not lobby:
        emit("reconnect")
        return

    game_m = game_mem.get_game(game_hash)
    lobby_data = get_lobby_by_alias(lobby)

    print(game_m.get("question_state"), lobby_data.get("allow_question_skip"), lobby_data.get("creator").get("hash"), user_hash)

    # To skip, the lobby must allow skips, or the user is the owner, or the question state is dead
    if game_m.get("question_state") != "dead" and not lobby_data.get("allow_question_skip") and lobby_data.get("creator").get("hash") != user_hash:
        return;

    # Increment buzzes_encountered
    result = increment_score_attribute(game_hash, "questions_encountered")

    # Get question ACCORDING TO LOBBY SETTINGS
    question = get_random_question(
        type=0, # Tossup
        difficulty=lobby_data.get("level"),
        category=CATEGORIES[lobby_data.get("category")], # Convert category number to string
        tournament=lobby_data.get("tournament", "all") # No tournament setting yet
    )


    # If the lobby is ranked, then we want to adjust user rank for users who don't answer a question
    #TODO: tell if lobby is ranked
    if lobby == "ranked" and game_m.get("current_question"):
        ranked_on_next_question(game_m, emit)

    game_mem.next_question(question, game_hash)

    # Set this question as the game's question
    set_question_to_game(question, lobby)

    emit("next_question", {"question": question, "timestamp": get_timestamp()}, room=f"lobby:{lobby}")

# Occurs only when the game in unpaused
@socketio.on("game_resume", namespace="/game")
def on_game_resume(data): # Empty
    lobby = request.environ.get("lobby")
    user_hash = request.environ.get("user_hash")
    if not user_hash:
        emit("failed_connection", {"message": "User does not exist", "code": 404})
        return;
    game_hash = request.environ.get("game_hash")

    print("RECEIVED GAME RESUME", game_hash, lobby)

    if not game_hash:
        emit("return_to_lobby")
        return;

    if not lobby:
        emit("reconnect")
        return

    user = get_user_by_hash(user_hash)
    lobby_data = get_lobby_by_alias(lobby)

    print("USER, LOBBY", user, lobby_data)

    # Check if user can resume (creator or admin)
    if user.get("username") != "admin" and user.get("id") != lobby_data.get("creator_id"):
        return

    game_mem.resume_game(game_hash)

    print("GAME RESUMED")

    emit("game_resumed", {"user": user, "timestamp": get_timestamp()}, room=f"lobby:{lobby}")

# Occurs only when a player pauses the game
@socketio.on("game_pause", namespace="/game")
def on_game_pause(data): # Empty
    lobby = request.environ.get("lobby")
    user_hash = request.environ.get("user_hash")
    if not user_hash:
        emit("failed_connection", {"message": "User does not exist", "code": 404})
        return;
    game_hash = request.environ.get("game_hash")

    if not game_hash:
        emit("return_to_lobby")
        return;

    if not lobby:
        emit("reconnect")
        return

    user = get_user_by_hash(user_hash)
    lobby_data = get_lobby_by_alias(lobby)

    # Check if user can pause (creator or admin)
    if user.get("username") != "admin" and user.get("id") != lobby_data.get("creator_id"):
        return

    game_mem.pause_game(game_hash)

    emit("game_paused", {"user": user, "timestamp": get_timestamp()}, room=f"lobby:{lobby}")

# Occurs when the question waiting time expires
@socketio.on("question_dead", namespace="/game")
def on_question_dead(data):
    lobby = request.environ.get("lobby")
    user_hash = request.environ.get("user_hash")
    if not user_hash:
        emit("failed_connection", {"message": "User does not exist", "code": 404})
        return;
    game_hash = request.environ.get("game_hash")

    if not game_hash:
        emit("return_to_lobby")
        return;

    if not lobby:
        emit("reconnect")
        return

    game_mem.set_question_state(game_hash, "dead")

# Occurs only when a player pauses the game
@socketio.on("save_question", namespace="/game")
def on_save_question(data): # Question hash
    lobby = request.environ.get("lobby")
    user_hash = request.environ.get("user_hash")
    if not user_hash:
        emit("failed_connection", {"message": "User does not exist", "code": 404})
        return;

    user = get_user_by_hash(user_hash)

    if not data.get("hash"):
        emit("saved_question_failed", {"message": "Question hash not provided"})
        return

    question = get_question_by_hash(data.get("hash"))

    result = save_question(question.get("id"), user.get("id"), saved_type="saved")

    emit("saved_question", {"question": question, "result": result})



@socketio.on("disconnect", namespace="/game")
def on_disconnect():
    # Use session here because request.environ is already gone on DC
    user_hash = session.get("user_hash")
    game_hash = session.get("game_hash")
    lobby = session.get("lobby")

    print(f"Received disconnect from /game {user_hash}")

    if not game_hash or not user_hash:
        return

    # Add the scores to the user's stats
    stats = remove_user_game_scores(game_hash, user_hash)

    total_stats = write_user_stats(user_hash, stats)

    lobby_data = get_lobby_by_alias(lobby)

    # TODO: Handle lobbies with multiple games
    lobby_data["games"][0]["teams"] = attatch_players_to_teams(lobby_data["games"][0]["teams"])

    # Give them their stats before they are disconnected
    emit("you_disconnected", {"stats": stats, "total_stats": total_stats})

    result = user_disconnect_from_lobby(user_hash)

    user = get_user_by_hash(user_hash)

    # Remove the user from the game
    game_mem.remove_user_from_game(user_hash, game_hash)

    emit("player_disconnected", {"lobby": lobby_data, "user": user}, room=f"lobby:{lobby}")