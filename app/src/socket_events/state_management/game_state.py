# TODO: Link these functions with the in-place game events


# Package imports
import time

# Source code imports
import src.db.utils as db


ANSWER_MS = 5000

class GameMemory:
    def __init__(self, game_hash, settings={}):
        self.questions = [],
        self.current_question = None,
        self.question_interrupts = [],
        self.question_count = 1,
        self.total_rounds = 20,
        self.users = {},



games = {
    # "game_hash": {
    #     "questions": [],
    #     "current_question": {...},
    #     "question_interrupts": [
    #         {
    #             "start_timestamp": 178908979,
    #             "end_timestamp": 178903478,
    #             "after_character": 287,
    #             "proportion_through": 0.89,
    #             "first_buzz": True,
    #             "user": {...},
    #         },
    #         ...
    #     ],
    #     "question_count": 1,
    #     "total_rounds": 20
    #     "users": {
    #         "hash": {
    #             ...
    #         }
    #     },
    # }
}

game_template = {
    "questions": [],
    "current_question": None,
    "question_interrupts": [],
    "question_count": 1,
    "total_rounds": 20,
    "users": {},
}

def create_game_memory_instance(game_hash: str, settings: dict = {}) -> dict:
    if games.get(game_hash):
        return games.get(game_hash)
    
    # Infuse user passed settings (like total rounds) if they passed any
    games[game_hash] = game_template | settings

    return games.get(game_hash)

def get_game(game_hash: str) -> dict:
    game = games.get(game_hash)

    if not game:
        raise Exception("get_game(): game does not exist")
    
    return game

def add_user_to_game(user_hash: str, game_hash: str) -> dict:
    game = get_game(game_hash)
    
    # If user_hash is a dict, then we don't want to query the database again
    user = None
    if type(user_hash) is str:
        user = db.get_user_by_hash(user_hash)
    else:
        user = user_hash
        user_hash = user.get("hash")

    # Check if they are already in the game
    if game["users"].get(user_hash):
        return game
    
    game["users"][user_hash] = user

    return game

def remove_user_from_game(user_hash: str, game_hash: str) -> dict:
    game = get_game(game_hash)
    
    del game["users"][user_hash]

    return game

def next_question(question_dict: dict, game_hash: str) -> dict:
    game = get_game(game_hash)
    
    game["question_count"] += 1
    game["current_question"] = question_dict
    game["questions"].append(question_dict)
    game["question_interrupts"] = []
    
    return game

def start_interrupt(user: str, game_hash: str, after_character: int = 0) -> dict:
    game = get_game(game_hash)

    # See if another user already has a buzz with no end_timestamp
    """
        p = the user has submitted
        q = there is still time to answer
        r = there is an unfinished buzz

        ~p & q -> r
    """
    unfinished_buzz = True in [
        not interrupt.get("end_timestamp")
        and
        interrupt.get("start_timestamp") + ANSWER_MS > int(time.time() * 1000)
        for interrupt in game["question_interrupts"]
    ]

    if unfinished_buzz:
        return 409

    proportion_through = after_character / len(game["current_question"]["question"])

    interrupt = {
        "start_timestamp": int(time.time() * 1000),
        "end_timestamp": None,
        "after_character": after_character,
        "proportion_through": proportion_through,
        "first_buzz": len(game["question_interrupts"]) == 0,
        "is_early": proportion_through <= 0.999,
        "is_power": proportion_through < 0.45,
        "is_correct": None,
        "user": user,
    }

    game["question_interrupts"].append(interrupt)

    return interrupt

def submit_interrupt(user_hash: str, game_hash: str, is_correct: bool=True) -> dict:
    game = get_game(game_hash)

    unfinished_interrupt = next((
        interrupt for interrupt in game["question_interrupts"]
        if interrupt["user"]["hash"] == user_hash and not interrupt["end_timestamp"]
    ), None)

    if not unfinished_interrupt:
        raise Exception("submit_interrupt(): No unfinished interrupt to alter")
    
    unfinished_interrupt["end_timestamp"] = int(time.time() * 1000)
    unfinished_interrupt["is_correct"] = is_correct

    # See if this is the last question in the game
    if game["question_count"] == game["total_rounds"]:
        return {"game": game, "message": "end of game", "code": 200}

    return unfinished_interrupt
