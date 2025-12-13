from .constructor import socketio
from flask_socketio import emit

# ===== INCOMMING EVENT HANDLERS =====

# When a player joins the lobby
@socketio.on("join_lobby")
def on_join_lobby():
    # Send GameState to the joining player (if possible)

    # do we echo the requested event type back to the user
    # or do we send it in an event channel that matches
    # the data type of the returning information?
    GameState = {}

    emit("you_joined", {GameState})
    # Send PlayerInformation about the new player to existing players
    
    Player = {}
    
    emit("player_joined", {Player}, broadcast=True)

# When a player buzzes
@socketio.on("buzz")
def on_buzz({Timestamp, AnswerContent}):
    # Broadcast that a player has buzzed
    emit("question_interrupt", {Player, AnswerContent}, broadcast=True)

# When a player is buzzing (every 100 ms or so when typing)
@socketio.on("typing")
def on_typing({AnswerContent}):
    # Broadcast that a player is typing
    emit("player_typing", {Player, AnswerContent}, broadcast=True)

# When the player has submitted their final answer
@socketio.on("submit")
def on_submit({FinalAnswer}):
    # Logic for determining if an answer is acceptable or not



    # If the answer is false
    emit("question_resume", {Player, FinalAnswer, Scores, IsCorrect}, broadcast=True)

    # If the answer is true
    emit("next_question", {Player, FinalAnswer, Scores, IsCorrect, Question}, broadcast=True)

# PAUSING AND PLAYING THE GAME

# Occurs only when the game in unpaused
@socketio.on("game_resume")
def on_question_resume({Player}):

    emit("game_resume", {Player}, broadcast=True)

# Occurs only when a player pauses the game
@socketio.on("game_pause")
def on_question_resume({Player}):

    emit("game_pause", {Player}, broadcast=True)
