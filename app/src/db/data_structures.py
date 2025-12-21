SERIALIZATION_CONFIG = {
    "Users": {
        "fields": [
            "id", "hash", "firstname", "lastname", "is_male", 
            "account_disabled", "email_verified"
        ],
        "relationships": {
            "player_instances": "Players"    
        },
    },
    "Stats": {
        "fields": ["id", "hash", "points", "corrects", "power", "negs", "bonuses", "rounds", "buzzes", "games", "average_time_to_buzz"],
        "relationships": {
            "player": "Players",
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
    "Players": {
        "fields": ["id", "hash", "name", "user_id", "stats_id", "lobby_id", "current_game_id"],
        "relationships": {
            "user": "Users",
            "stats": "Stats",
            "lobby": "Lobbies",
            "current_game": "Games"
        },
    },
    "Lobbies": {
        "fields": ["id", "hash", "name", "total_games"],
        "relationships": {
            "games": "Games",
            "players": "Players",
        },
    },
    "Games": {
        "fields": ["id", "hash", "active", "question_number", "game_mode", "rounds", "teams", "level", "category", "speed", "lobby_id", "current_question_id"],
        "relationships": {
            "lobby": "Lobbies",
            "players": "Players"
        }
    }
}

RELATIONSHIP_DEPTHS_BY_ROUTE = {
    "db:player": {"user": 0, "lobby": 0, "stats": 0},
    "db:lobby": {"players": 0, "games": 0},
    "db:game": {}
}