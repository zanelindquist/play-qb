SERIALIZATION_CONFIG = {
    "Users": {
        "fields": [
            "id", "hash", "username", "is_male", "is_online", "premium", "account_disabled", "email_verified", "current_game_id", "current_lobby_id"
        ],
        "relationships": {
            "friends": "Users",
            "created_lobbies": "Lobbies",
            "current_game": "Games",
            "current_lobbies": "Lobbies",
            "stats": "Stats",
            "sent_requests": "Friends",
            "received_requests": "Friends",
        },
    },
    "Stats": {
        "fields": ["id", "user_ud", "hash", "points", "correct", "power", "incorrect", "bonuses", "rounds", "buzzes", "games", "average_time_to_buzz", "questions_encountered", "buzzes_encountered"],
        "relationships": {
            "user": "Users"
        },
    },
    "Reports": {
        "fields": ["id", "hash", "reason_code", "flagged_category", "description", "question_id"],
        "relationships": {
            "question": "Questions"
        },
    },
    "Questions": {
        "fields": ["id", "hash", "tournament", "type", "year", "level", "difficulty", "category", "category_confidence", "question", "answers", "prompts"],
        "relationships": {
            "reports": "Reports"
        },
    },
    # "Players": {
    #     "fields": ["id", "hash", "name", "user_id", "stats_id", "lobby_id", "current_game_id"],
    #     "relationships": {
    #         "user": "Users",
    #         "stats": "Stats",
    #         "lobby": "Lobbies",
    #         "current_game": "Games"
    #     },
    # },
    "Lobbies": {
        "fields": ["id", "hash", "creator_id", "public", "name", "total_games", "level", "category", "speed", "gamemode", "rounds", "bonuses", "allow_multiple_buzz", "allow_question_skip", "allow_question_pause", "number_of_online_players"],
        "relationships": {
            "games": "Games",
            "creator": "Users"
        },
    },
    "Games": {
        "fields": ["id", "hash", "active", "question_number", "game_mode", "rounds", "teams", "lobby_id", "current_question_id"],
        "relationships": {
            "lobby": "Lobbies",
            "current_question": "Questions"
        }
    },
    "SavedQuestions": {
        "fields": ["id", "hash", "category", "user_id", "question_id"],
        "relationships": {
            "question": "Questions",
            # "user": "Users" # We don't need this since we always fetch by user. Redundant on the front end
        }
    }
}

RELATIONSHIP_DEPTHS_BY_ROUTE = {
    "db:user": {"current_game": 0, "current_lobby": 0},
    # "db:player": {"user": 0, "lobby": 0, "stats": 0},
    "db:lobby": {"players": 0, "games": 0},
    "db:lobby_info": {},
    "db:game": {"current_question": 0},
    "db:users": {},
    "db:stat": {"player": {"lobby": 0}},
    "db:question": {}
}
