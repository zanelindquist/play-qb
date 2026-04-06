SERIALIZATION_CONFIG = {
    "Users": {
        "fields": [
            "id", "hash", "username", "is_male", "is_online", "premium", "xp", "level", "account_disabled", "email_verified", "current_game_id", "current_lobby_id", "created_at"
        ],
        "relationships": {
            "friends": "Users",
            "created_lobbies": "Lobbies",
            "current_game": "Games",
            "current_lobbies": "Lobbies",
            "stats": "Stats",
            "sent_requests": "Friends",
            "received_requests": "Friends",
            "email_verification": "Email_Verifications"
        },
    },
    "Stats": {
        "fields": ["id", "user_ud", "hash", "points", "correct", "power", "incorrect", "bonuses", "rounds", "buzzes", "games", "average_time_to_buzz", "questions_encountered", "buzzes_encountered", "visible_rank", "rank_points", "skill_mu", "skill_sigma", "last_active_at"],
        "relationships": {
            "user": "Users"
        },
    },
    "Reports": {
        "fields": ["id", "hash", "reason_code", "flagged_category", "description", "question_id", "created_at"],
        "relationships": {
            "question": "Questions"
        },
    },
    "Questions": {
        "fields": ["id", "hash", "tournament", "type", "year", "level", "difficulty", "category", "category_confidence", "question", "answers", "prompts", "created_at", "difficulty_mu", "difficulty_sigma", "times_asked"],
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
        "fields": ["id", "hash", "creator_id", "public", "is_ranked", "name", "total_games", "level", "category", "speed", "gamemode", "rounds", "bonuses", "allow_multiple_buzz", "allow_question_skip", "allow_question_pause", "number_of_online_players", "created_at"],
        "relationships": {
            "games": "Games",
            "creator": "Users"
        },
    },
    "Games": {
        "fields": ["id", "hash", "active", "question_number", "game_mode", "rounds", "teams", "lobby_id", "current_question_id", "created_at", "active_at"],
        "relationships": {
            "lobby": "Lobbies",
            "current_question": "Questions"
        }
    },
    "SavedQuestions": {
        "fields": ["id", "hash", "category", "user_id", "question_id", "created_at"],
        "relationships": {
            "question": "Questions",
            # "user": "Users" # We don't need this since we always fetch by user. Redundant on the front end
        }
    },
    "UserCategorySkill": {
        "fields": ["id", "hash", "category_code", "mu", "sigma", "questions_seen", "user_id"]
    },
    "RatingParams": {
        "fields": ["id", "name", "value"]
    },
    "Email_verifications": {
        "fields": ["id", "hash", "code", "expires_at", "user_id"],
        "relationships": {
            "user": "Users"
        }
    }
}

RELATIONSHIP_DEPTHS_BY_ROUTE = {
    "db:user": {"current_game": 0, "current_lobby": 0},
    "client:user": {"stats": 0},
    # "db:player": {"user": 0, "lobby": 0, "stats": 0},
    "db:lobby": {"players": 0, "games": 0, "creator": 0},
    "db:lobby_info": {},
    "db:game": {"current_question": 0},
    "db:users": {},
    "db:stat": {"player": {"lobby": 0}},
    "db:question": {}
}

RATING_PARAMS = [
    {"id": 1, "name": "beta", "value": 50, "description": "Standard deviation noise"},
    {"id": 2, "name": "alpha", "value": 0.6, "description": "Proportion of mu delta that goes to global skill"},
    {"id": 3, "name": "min_sigma", "value": 100, "description": "Lowest standard deviation a user can have"},
    {"id": 4, "name": "initial_mu", "value": 1500, "description": None},
    {"id": 5, "name": "initial_sigma", "value": 350, "description": None},
    {"id": 6, "name": "time_penalty", "value": 2.25, "description": "Used in buzz_fraction ** tp to lessen weight of early wrong buzzes"},
    {"id": 7, "name": "q_min_sigma", "value": 100, "description": None},
    {"id": 8, "name": "q_initial_sigma", "value": 600, "description": None},
    {"id": 9, "name": "max_mu_drop", "value": 3, "description": "Maximum skill mu drop from an incorrect question"},
    {"id": 10, "name": "delta_split_weight", "value": 0.4, "description": None},
    {"id": 11, "name": "scrape_offset", "value": 1000, "description": "Webscraper variable to track the question query scraping index"},
    {"id": 13, "name": "scrape_index", "value": 691, "description": None},
]