# Import all of our models
from .models import *

import html
from datetime import datetime, timezone, timedelta, date
import re
import math
import random
from functools import reduce
from decimal import Decimal
from difflib import SequenceMatcher

from sqlalchemy import select, or_, and_, not_, delete, func, desc, literal, case, exists, update, text
from sqlalchemy.orm import scoped_session, sessionmaker, joinedload, class_mapper, subqueryload
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.inspection import inspect

from .data_structures import SERIALIZATION_CONFIG, RELATIONSHIP_DEPTHS_BY_ROUTE as REL_DEP, RATING_PARAMS
from .db import *
from .models.hash import *
import src.db.ranked as ranked
from src.db.classes import *
from src.db.cache import *
import jellyfish


# Answer judging constants
BRACKETED = re.compile(r"\[.*?\]")
PARENTHETICAL = re.compile(r"(\(.*?\)|<.*?>)")
LEADING_DIRECTIVES = re.compile(
    r"^(accept on|prompt on|accept|prompt|do not accept|reject)[:\-]\s*",
    re.I
)
TRAILING_DIRECTIVES = re.compile(
    r"(—|;).*?$"
)
ROMAN_NUMERAL = re.compile(r"^(?=[MDCLXVI])M{0,4}(CM|CD|D?C{0,3})"
                           r"(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$", re.I)
COMMON_WORDS  = {
    "a", "an", "the",
    "and", "or", "but",
    "of", "to", "in", "on", "at", "by", "for", "with",
    "from", "into", "over", "under",
    "is", "are", "was", "were", "be", "been", "being",
    "this", "that", "these", "those"
}

# Creating a lobby
MUTATABLE_RULES = ["name", "gamemode", "category", "rounds", "level", "speed", "bonuses", "allow_multiple_buzz", "allow_question_skip", "allow_question_pause", "public", "creator_id"]
CATEGORIES = [
    "all",
    "science",
    "history",
    "literature",
    "social science",
    "philosophy",
    "religion",
    "mythology",
    "geography",
    "fine arts",
    "current events"
    "custom",
];
CATEGORY_CODES = [
    "science",
    "history",
    "literature",
    "social science",
    "philosophy",
    "religion",
    "mythology",
    "geography",
    "fine arts",
    "current events"
]

# TODO: protect ranked lobbies
PROTECTED_LOBBIES = ["solos", "duos", "trios", "squads", "5v5", "custom", "ranked",
                     "middleschool", "highschool", "college", "open",
                     "highschool-science", "highschool-history", "highschool-literature", "highschool-philosophy",
                     "college-science", "college-history", "college-literature", "college-philosophy", 
                    ]

DEFAULT_SETTINGS = {
    "public": False,
    "is_ranked": False,
    "total_games": 0,
    "level": 0,  # All, middle school, high school, college, open
    "category": 0,  # Everything, science, history, literature, social science, philosophy, religion, mythology, geography, fine arts, current events, custom
    "speed": 400,
    "gamemode": "solos",
    "rounds": 20,
    "bonuses": False,
    "allow_multiple_buzz": True,
    "allow_question_skip": True,
    "allow_question_pause": True,
}

# Cleaning up database
LOBBY_DELETE_DAYS = 10

def normalize(s: str) -> str:
    text = re.sub(r"\s+", " ", s.lower().strip())

    # Remove common meaningless words
    text = " ".join([w for w in text.split(" ") if w not in COMMON_WORDS])

    return text

def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()

def generate_code():
    return str(random.randint(100000, 999999))


#========HELPER FUNCTIONS=======

def json_safe(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value

def to_dict_safe(obj, depth=0, gentle=True, rel_depths=None):
    # If depth is 0 we only lo the static properties of object
    # If depth is 1 we load the static properties of obj's relationships
    # If rel depths is equal to "LENGTH", then we just want to return {"length": <length>}

    """
    Serialize an SQLAlchemy object to a dictionary based on the defined configuration.

    :param obj: SQLAlchemy model instance.
    :param model_name: Name of the model (key in SERIALIZATION_CONFIG).
    :param depth: Current depth for recursive relationships (default: 1).
    :return: Serialized dictionary.
    """
        
    if obj is None:
        return None
    
    # Set the model name to the capitalized name of the table obj is from
    model_name = inspect(obj).mapper.local_table.name.capitalize()
    
    config = SERIALIZATION_CONFIG.get(model_name, {})
    if not config:
        raise ValueError(f"No serialization configuration found for model: {model_name}")

    fields = config.get("fields", [])
    aux_fields = config.get("aux_fields", [])
    relationships = config.get("relationships", {})

    # gentle=False will get all fields, not just the ones in fields
    result = None
    if gentle:
        result = {
            field: json_safe(getattr(obj, field))
            for field in fields
            if hasattr(obj, field)
        }
    else:
        result = {
            c.key: getattr(obj, c.key)
            for c in inspect(obj).mapper.column_attrs
        }

    for rel, rel_table in relationships.items():
        if depth > 0 or (isinstance(rel_depths, dict) and rel in rel_depths.keys()) or rel_depths == "LENGTH":
            # Everything here is either above depth 0 or has it special "entry card"
            related_obj = getattr(obj, rel, None)
            rel_depth = depth - 1

            custom_rel_depths = None

            # If this is a dict
            if rel_depths and not isinstance(rel_depths, (int, str)):
                for key, value in rel_depths.items():
                    if rel == key and not isinstance(value, int):
                        # If this is a whitelisted field, pass the dict down
                        custom_rel_depths = value

            # If the property is included in the list and its value is a number
            if isinstance(rel_depths, dict) and rel in rel_depths.keys() and isinstance(rel_depths.get(rel), int):
                rel_depth = rel_depths.get(rel)

            # If the property is included in the list and it is"LENGTH"
            if isinstance(rel_depths, dict) and rel in rel_depths.keys() and rel_depths.get(rel) == "LENGTH":
                result[rel] = {"length": len(related_obj)}
            elif isinstance(related_obj, list): # One-to-many
                result[rel] = [to_dict_safe(child, depth=rel_depth, rel_depths=custom_rel_depths) for child in related_obj]
            elif related_obj:  # One-to-one
                result[rel] = to_dict_safe(related_obj, depth=rel_depth, rel_depths=custom_rel_depths)

    # After we have consitered normal relationships, lets do aux_fields
    if rel_depths != "LENGTH":
        for aux in aux_fields:
            for rel_name, fields in aux.items():
                if rel_name in relationships:  # Ensure the auxiliary field is valid
                    related_obj = getattr(obj, rel_name, None)
                    if related_obj:  # Check if the related object exists
                        if isinstance(related_obj, list):  # Handle one-to-many relationships
                            if result.get(rel_name):
                                result.extend([
                                    {field: getattr(child, field) for field in fields if hasattr(child, field)}
                                    for child in related_obj
                                ])
                            else:
                                result[rel_name] = [
                                    {field: getattr(child, field) for field in fields if hasattr(child, field)}
                                    for child in related_obj
                                ]
                        else:  # Handle one-to-one relationships
                            if result.get(rel_name):
                                result[rel_name] |= {field: getattr(related_obj, field) for field in fields if hasattr(related_obj, field)}
                            else:
                                result[rel_name] = {field: getattr(related_obj, field) for field in fields if hasattr(related_obj, field)}

    return result

# Recurisive function to sanitize every crany of any data
def sanitize_data(data):
    if isinstance(data, dict):
        return {key: sanitize_data(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    elif isinstance(data, str):
        # Sanitize against HTML XSS attacks. We don't want the user to input html that could then be passed back to the browser and interpreted as HTML in an XSS attack. I think...
        return html.escape(data)
    else:
        return data
    
def validate_data(data, key=False, check_email=True):
    global validation_list

    if isinstance(data, dict):
        return {key: validate_data(value, key=key) for key, value in data.items()}
    elif isinstance(data, list):
        return [validate_data(item) for item in data]
    # If the value is a string, and has a key value set, that is on our validation list
    elif isinstance(data, str) and key in validation_list.keys():
        if key == "email" and not check_email:
            return data
        return validation_list[key](data)
    elif isinstance(data, (int, float)):
        return validation_list[key](data)
    else:
        return data

# Items is a list of dicts, fields is a list of strings of the keys on those dicts, and query is what to filter by
def search_filter(items, keys, query):
    if not query:
        return items
    
    query = query.lower()
    
    filtered = []
    for item in items:
        for key in keys:
            value = item.get(key)
            if value and type(value) == str:
                value = value.lower()
                # Filtering logic
                # String starting with
                if value.startswith(query):
                    filtered.append(item)
                    continue

                # Filter by token matching
                query_tokens = set(query.tolist())
                value_tokens = set(query.tolist())

                # Compare overlay
                overlap = query_tokens & value_tokens

                if overlap / len(value_tokens) >= 0.8:
                    filtered.append(item)
                    continue

    return filtered

def get_category_code(category: str):
    return CATEGORY_CODES.index(category)

def get_category_from_code(index: int):
    return CATEGORY_CODES[index]


# CREATING RESOURCES

def create_user(data):
    try:
        data["email"] = validate_email(data.get("email"))
        data["password"] = validate_password_hash(data.get("password"))
        data["username"] = validate_username(data.get("username"))
    except Exception as e:
        return {'message': 'create_user(): failure', "code": 400, "error": f"{e}"}

    try:
        session = get_session()

        data["account_disabled"] = True
        data["email_verified"] = False
        data["premium"] = True

        new_user = Users(
            **data
        )

        session.add(new_user)
        session.flush()

        stats = Stats(
            user_id=new_user.id
        )

        session.add(stats)
        session.commit()

        return {'message': 'create_user(): success', "user": to_dict_safe(new_user), "code": 201}
    
    except Exception as e:
        print(e)
        session.rollback()
        # Check if the error code corresponds to a duplicate entry for email
        if 'Duplicate entry' in f"{e}":
            return {'message': 'create_user(): failure', "code": 400, "error": "Email is taken."}

        return {'message': 'create_user(): failure', "code": 500, "error": f'{e}'}
    
    finally:
        session.remove()

# TEMPORARY
def create_stat_for_all_users_temp():
    session = get_session()

    users = session.execute(
        select(Users)
    ).scalars().all()

    for user in users:

        stats = Stats(
            user_id=user.id
        )

        session.add(stats)

    session.commit()
    print("Added stats for all users")

# Creates a game by default for this lobby
# If the games get deleted somehow, just go into a custom and create lobbies with the name and it will auto create the game
def create_lobby(settings):
    session = get_session()
    try:
        lobby = get_lobby_by_alias(settings.get("name"))
        if lobby:
            # If there is a lobby, we want to make sure it has a game
            #TODO: Handle multiple games per lobby
            game = session.execute(
                select(Games)
                .where(Games.lobby_id == lobby.get("id"))
            ).scalars().first()

            if not game:
                game = Games(
                    lobby_id=lobby.get("id"),
                    teams={},
                    rounds=[]
                )
                session.add(game)
                
                session.commit()

            return {'message': 'create_lobby(): lobby already exists', "code": 403}
        
        columns = {}

        for column in MUTATABLE_RULES:
            if settings.get(column):
                columns[column] = settings[column]

        # Translate the categories to its number code
        # TODO: Handle custom percentages for categories
        if columns.get("category"):
            columns["category"] = CATEGORIES.index(columns["category"])

        lobby = Lobbies(
            **columns
        )
        session.add(lobby)
        session.flush()

        # Make sure each lobby has a game
        game = Games(
            lobby_id=lobby.id,
            teams={},
            rounds=[]
        )
        session.add(game)
        
        session.commit()

        lobby_data = to_dict_safe(lobby)

        return {'message': 'create_lobby(): success', "code": 200, 'lobby': lobby_data}
    except Exception as e:
        session.rollback()
        return {'message': 'create_lobby(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def create_friend_request(user_hash, hash):
    session = get_session()
    try:
        user = get_user_by_hash(user_hash)
        target = get_user_by_hash(hash)

        if not user or not target:
            return {'message': 'Cannot find sender or target', "code": 404}
        
        if user.get("id") == target.get("id"):
            return {'message': "Cannot send yourself a friend request", "code": 400}

        # See if there is already a friend request
        correct_direction_request = session.execute(
            select(Friends)
            .where(
                and_(Friends.sender_id == user.get("id"), Friends.receiver_id == target.get("id"))
            )
        ).scalars().first()

        if correct_direction_request:
            if correct_direction_request.is_accepted:
                return {'message': 'You are already friends', "code": 409}
            return {'message': 'This user already has a pending friend request', "code": 409}
        
        # If the target has sent the user a friend request, then we want to make it is_accepted
        reverse_direction_request = session.execute(
            select(Friends)
            .where(
                and_(Friends.sender_id == target.get("id"), Friends.receiver_id == user.get("id"))
            )
        ).scalars().first()

        if reverse_direction_request:
            if reverse_direction_request.is_accepted:
                return {'message': 'You are already friends', "code": 409}
            setattr(reverse_direction_request, "is_accepted", True)
            return {'message': 'You are now friends with ' + target.get("username"), "code": 201}


        friend_request = Friends(
            sender_id=user.get("id"),
            receiver_id=target.get("id")
        )

        session.add(friend_request)
        session.commit()

        return {'message': 'Friend request sent to ' + target.get("username"), "code": 200}
    except Exception as e:
        session.rollback()
        return {'message': 'create_friend_request(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def save_question(question_id, user_id, saved_type="missed"): # category= missed, correct, saved
    session = get_session()
    try:
        # There could be two: one for tracking correct answers, and one as just a saved
        saved_questions = session.execute(
            select(SavedQuestions)
            .where(
                and_(
                    SavedQuestions.question_id == question_id,
                    SavedQuestions.user_id == user_id,
                )
            )
        ).scalars().all()

        answer_tracking_question = None
        saved_question = None
        for sq in saved_questions:
            if sq.saved_type == "saved":
                saved_question = sq
            else:
                answer_tracking_question = sq

        if answer_tracking_question and saved_type != "saved":
            # If there is a saved question already, but the new saved type = saved and the old saved type is not missed, make a new question
            # If the new saved type is saved and the category is missed or correct, we want to add a new question anyway
            
            # If they just got the answer correct and there is already an instance of them getting it wrong, then change teh SavedQuestion to correct
            if saved_type == "correct" and answer_tracking_question.saved_type == "missed":
                setattr(answer_tracking_question, "saved_type", "correct")

            # Increment the categories
            if saved_type == "missed":
                setattr(answer_tracking_question, "missed_count", answer_tracking_question.missed_count + 1)
            elif saved_type == "correct":
                setattr(answer_tracking_question, "correct_count", answer_tracking_question.correct_count + 1)
            session.commit()

            return
        
        if saved_question and saved_type == "saved":
            return {'message': 'save_question(): that question is already saved', "code": 403}

        new_saved_question = SavedQuestions(
            question_id=question_id,
            user_id=user_id,
            saved_type=saved_type,
            missed_count=1 if saved_type == "missed" else 0,
            correct_count=1 if saved_type == "correct" else 0
        )

        session.add(new_saved_question)
        
        session.commit()

        return {'message': 'save_question(): success', "code": 200}
    except Exception as e:
        session.rollback()
        print(e)
        return {'message': 'save_question(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()


# RETRIEVING RESOURCES

# All of thse functions must return dicts, not SQL Alchemy objects

def get_user_by_email(email, gentle=True, advanced=False, rel_depths=None, depth=0):
    try:
        session = get_session()
        user = None
        user = session.execute(
            select(Users)
            .where(Users.email == email)
        ).scalars().first()

        if advanced:
            return to_dict_safe(user, gentle=True, rel_depths=[], depth=3)
        else:
            return to_dict_safe(user, gentle=gentle, rel_depths=rel_depths if rel_depths else REL_DEP["db:user"], depth=depth)
    except Exception as e:
        print(e)
        return None
    finally:
        session.remove()

def get_user_by_hash(hash, gentle=True, advanced=False, rel_depths=None, depth=0):
    try:
        session = get_session()
        user = None

        user = session.execute(
            select(Users)
            .where(Users.hash == hash)
        ).scalars().first()

        if advanced:
            return to_dict_safe(user, gentle=True, rel_depths=[], depth=3)
        else:
            return to_dict_safe(user, gentle=gentle, rel_depths=rel_depths, depth=depth)
    except Exception as e:
        return None
    finally:
        session.remove()

def get_random_question(difficulty="all", category="all", tournament="all", type=0):
    try:
        ids = get_cached_question_ids(type=type, difficulty=difficulty, category=category, tournament=tournament)

        if not ids:
            return {
                "code": 404,
                "error": "No questions meet this query"
            }

        random_id = random.choice(ids)

        session = get_session()

        question = session.execute(
            select(Questions).where(Questions.id == random_id)
        ).scalars().first()

        q = to_dict_safe(question, depth=0)

        parsed_answers = {}
        keys = ["main", "accept", "prompt", "reject", "suggested_category"]

        for index, part in enumerate(q.get("answers").split(" || ")):
            parsed_answers[keys[index]] = (
                part.split(" | ") if (part != "NONE" and part != "") else None
            )

        parsed_answers["main"] = parsed_answers["main"][0]

        q["answers"] = parsed_answers

        return q

    except Exception as e:
        return {"code": 400, "error": str(e)}

def get_question_by_hash(hash):
    try:
        session = get_session()
        question = None

        question = session.execute(
            select(Questions)
            .where(Questions.hash == hash)
        ).scalars().first()

        return to_dict_safe(question)
    except Exception as e:
        print(e)
        return None
    finally:
        session.remove()

def get_lobby_by_alias(lobbyAlias):
    session = get_session()
    try:
        lobby = session.execute(
            select(Lobbies)
            .where(Lobbies.name == lobbyAlias)
        ).scalars().first()

        if not lobby:
            return False;

        return to_dict_safe(lobby, rel_depths=REL_DEP["db:lobby"], depth=0)

    except Exception as e:
        session.rollback()
        return {'message': 'get_lobby_by_alias(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def get_game_by_hash(game_hash: str) -> dict:
    session = get_session()
    try:
        game = session.execute(
            select(Games)
            .where(Games.hash == game_hash)
        ).scalars().first()

        if not game:
            return False;

        return to_dict_safe(game, rel_depths=REL_DEP["db:game"], depth=0)

    except Exception as e:
        session.rollback()
        return {'message': 'get_lobby_by_alias(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def get_game_by_lobby_alias(lobbyAlias):
    session = get_session()
    try:
        # Assuming every lobby only has one game
        game = session.execute(
            select(Games)
            .join(Lobbies, Games.lobby_id == Lobbies.id)
            .where(Lobbies.name == lobbyAlias)
        ).scalars().first()

        if not game:
            return False;
    
        return to_dict_safe(game, rel_depths=REL_DEP["db:game"], depth=0)

    except Exception as e:
        session.rollback()
        return {'message': 'get_game_by_lobby_alias(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def get_friends_by_hash(hash, online=False, party=False):
    session = get_session()

    if not hash:
        raise Exception("get_friends_by_hash(): No hash provided")
    
    user = session.execute(
        select(Users)
        .where(Users.hash == hash)
    ).scalars().first()

    if not user:
        return []
    
    friends = session.execute(
        select(Friends)
        .where(
            or_(
                Friends.sender_id == user.id,
                Friends.receiver_id == user.id,
            ),
            and_(
                Friends.is_accepted == True
            )
        )
    ).scalars().all()


    filtered_friends = []
    for friend in friends:
        # Get the other person
        target = friend.sender
        if friend.sender_id == user.id:
            target = friend.receiver

        # Filter for online if that is present
        if online:
            if target.is_online:
                filtered_friends.append(target)
        else:
            filtered_friends.append(target)
    # Filter for parties if that is present
    if party:
        filtered_friends = [friend for friend in filtered_friends if not friend.hash in party.get("members")]
    return [
        to_dict_safe(friend) for friend in filtered_friends
    ]

def get_friend_requests_by_hash(hash):
    session = get_session()

    if not hash:
        raise Exception("get_friends_by_hash(): No hash provided")
    
    user = session.execute(
        select(Users)
        .where(Users.hash == hash)
    ).scalars().first()

    if not user:
        return []
    
    requests = session.execute(
        select(Friends)
        .where(
            Friends.receiver_id == user.id,
            Friends.is_accepted == False
        )
    ).scalars().all()


    pending_senders = []
    for r in requests:
        # Get the sender

        # Filter for online if that is present
        pending_senders.append(r.sender)
    # Filter for parties if that is present
    return [
        to_dict_safe(sender) for sender in pending_senders
    ]

def get_users_by_query(query):
    session = get_session()
    users = session.execute(
        select(
            Users.hash,
            Users.username
        )
        .where(
            or_(
                Users.username.ilike(f"%{query}%"),
            )
        )
        .limit(20)
    ).all()

    # REL DEP is empty right now
    return [{"hash": user[0], "username": user[1]} for user in users]

def get_lobbies_by_query(query: str, user_id: int = None, public: bool = False) -> list:
    session = get_session()

    if not query:
        return []

    and_conditions = [
        Lobbies.name.ilike(f"%{query}%")
    ]

    or_conditions = []

    # creator can see their own
    if user_id is not None:
        or_conditions.append(Lobbies.creator_id == user_id)

    # public lobbies are visible
    if public:
        or_conditions.append(Lobbies.public == True)

    # If no visibility rules, return nothing
    if not or_conditions:
        return []

    lobbies = session.execute(
        select(Lobbies)
        .where(
            and_(
                *and_conditions,
                or_(*or_conditions)
            )
        )
        .limit(10)
    ).scalars().all()

    return [to_dict_safe(lobby, rel_depths=REL_DEP["db:lobby_info"]) for lobby in lobbies]

def attatch_players_to_teams(teams: dict):
    mutated_teams = teams

    for team_hash, team in teams.items():
        for player_hash, player in team["members"].items():
            player = get_user_by_hash(player_hash)
            mutated_teams[team_hash]["members"][player_hash]["player"] = player

    return mutated_teams

def get_stats_by_hash(hash: str) -> list:
    session = get_session()
    try:
        user = session.execute(
            select(Users)
            .where(Users.hash == hash)
        ).scalars().first()

        if not user:
            return False;

        return to_dict_safe(user.stats, rel_depths=REL_DEP["db:stat"])

    except Exception as e:
        session.rollback()
        return {'message': 'hash(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def get_saved_questions(hash, saved_type="all", category="all", offset=0, limit=20):
    try:
        session = get_session()
        
        user = session.execute(
            select(Users)
            .where(Users.hash == hash)
        ).scalars().first()

        where_clauses = [SavedQuestions.user_id == user.id]

        if saved_type != "all":
            where_clauses.append(SavedQuestions.saved_type == saved_type)

        # Build base statement with all filters
        base_stmt = select(SavedQuestions).where(*where_clauses).order_by(SavedQuestions.created_at.desc())

        # Only join if filtering by question category
        if category != "all":
            base_stmt = base_stmt.join(SavedQuestions.question).where(Questions.category == category)

        # Get total count
        total = session.execute(
            select(func.count()).select_from(base_stmt.subquery())
        ).scalar_one()

        # Execute paginated query
        saved_questions = session.execute(
            base_stmt.limit(limit).offset(offset)
        ).scalars().all()

        parsed = []

        for sq in saved_questions:
            q = to_dict_safe(sq.question, rel_depths=REL_DEP["db:question"])
            parsed_answers = {}
            keys = ["main", "accept", "prompt", "reject", "suggested_category"]
            index = 0;
            for part in q.get("answers").split(" || "):
                parsed_answers[keys[index]] = part.split(" | ") if (part != "NONE" and part != "") else None
                index += 1

            # Make the main answer not a list
            parsed_answers["main"] = parsed_answers["main"][0]

            # Parse answer
            q["answers"] = parsed_answers
            q["saved_type"] = sq.saved_type
            q["correct_count"] = sq.correct_count
            q["missed_count"] = sq.missed_count

            parsed.append(q)

        return {"questions": parsed, "total": total}

    except Exception as e:
        print(e)
        return {'message': 'get_saved_questions(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.remove()

def get_rating_params() -> RatingParameters:
    try:
        session = get_session()
        
        params = session.execute(
            select(RatingParams)
        ).scalars().all()

        # If there are no parameters, insert them
        if not params:
            query = text("""
            INSERT INTO rating_params (id, name, value, description, created_at)
            VALUES (:id, :name, :value, :description, NOW())
            """)

            session.execute(query, RATING_PARAMS)
            session.commit()

            params = session.execute(
                select(RatingParams)
            ).scalars().all()

        dict_params = {}

        for param in params:
            dict_params[param.name] = param.value

        return RatingParameters(dict_params)

    except Exception as e:
        return {'message': 'get_saved_questions(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.remove()

def get_email_verification_by_user_id(user_id: int) -> dict:
    try:
        session = get_session()
        verification = session.execute(
            select(EmailVerifications)
            .where(EmailVerifications.user_id == user_id)
        ).scalars().first()

        return to_dict_safe(verification)
    except Exception as e:
        print(e)
        return None
    finally:
        session.remove()



# EDITING RESOURCES

def set_user_online(hash: str, online=True):
    try:
        session = get_session()

        user = session.execute(
            select(Users)
            .where(Users.hash == hash)
        ).scalars().first()

        setattr(user, "is_online", online)

        session.commit()

        return {"message": "set_user_online(): success", "code": 200}

    except Exception as e:
        session.rollback()
        return {"message": "set_user_online(): failure","error": e, "code": 500}
    finally:
        session.remove()

def add_player_to_game_scores(game_hash:str, player_hash: str, team_hash:str = None, team_name: str = None):
    session = get_session()
    try:
        game = session.execute(
            select(Games)
            .where(Games.hash == game_hash)
        ).scalars().first()

        modified_teams = None;

        score_template = {
            "points": 0,
            "correct": 0,
            "power": 0,
            "incorrect": 0,
            "buzzes": 0,
            "buzzes_encountered": 0,
            "early": 0,
            "bonuses": 0,
            "questions_encountered": 0,
            
            "rounds": 0,
            "games": 0,
            "average_time_to_buzz": 0,
        }
        
        # 1. Get the game from the hash
        game_dict = to_dict_safe(game, rel_depths=REL_DEP["db:game"], depth=0)
        
        # 2. Access the teams property (see the JSON in the README)
        teams = game_dict.get("teams")
        modified_teams = teams;

        team_template = {
            "name": team_name if team_name else f"Team {len(teams.keys()) + 1}",
            "color": get_hex_color(len(teams.keys())),
            "score": 0,
            "members": {

            }
        }

        found_player = False
        # Check and see if the player is already in a team
        for t_hash in list(teams.keys()):
            if player_hash in teams[t_hash]["members"].keys():
                found_player = True

        if found_player:
            return teams

        # 3. IF there is a team_hash, add the player to that, otherwise make their own team
        if team_hash:
            # If we are passed a team hash, but there isn't one, lets set the team with this hash
            found_team = False
            for t_hash in list(teams.keys()):
                if t_hash == team_hash:
                    modified_teams[t_hash]["members"][player_hash] = score_template
                    found_team = True

            if not found_team:
                modified_teams[team_hash] = team_template

                modified_teams[team_hash]["members"][player_hash] = score_template
        else:
            # 4. Create a team
            new_team_hash = generate_unique_hash()
            modified_teams[new_team_hash] = team_template

            # 5. Add the player to that team
            modified_teams[new_team_hash]["members"][player_hash] = score_template        

        # 6. Set the teams in the database
        setattr(game, "teams", modified_teams)
        flag_modified(game, "teams")
        session.commit()
        # 7. Return the updated teams
        return modified_teams


    except Exception as e:
        session.rollback()
        return {'message': 'get_lobby_by_alias(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def set_game_scores(game_hash: str, player_hash: str, diff: dict) -> dict:
    """
        1. Get the game from the hash
        2. Access the teams property (see the JSON in the README)
        3. Find the team that has a member with the player_hash
        4. For every property in the diff, add the value of the diff to it
        5. Put the modififed diff and overall object back into the teams structure
        6. Return the updated teams
    """

    session = get_session()
    try:
        game = session.execute(
            select(Games)
            .where(Games.hash == game_hash)
        ).scalars().first()

        modified_teams = None;

        # 1. Get the game from the hash
        game_dict = to_dict_safe(game, rel_depths=REL_DEP["db:game"], depth=0)
        # 2. Access the teams property (see the JSON in the README)
        teams = game_dict.get("teams")
        modified_teams = teams;
        # 3. Find the team that has a member with the player_hash
        for team_hash in list(teams.keys()):
            for team_member_hash in list(teams[team_hash].get("members").keys()):
                if player_hash == team_member_hash:
                    breakdown = teams[team_hash]["members"][team_member_hash]
                    # 4. For every property in the diff, add the value of the diff to it
                    for key in list(diff.keys()):
                        # Make sure that this property is already in the diff (no funny business with modification)
                        if key in list(breakdown.keys()): 
                            breakdown[key] += diff[key];
                    # 5. Put the modififed diff and overall object back into the teams structure
                    modified_teams[team_hash]["members"][team_member_hash] = breakdown
        
        # 6. Set the teams in the database
        setattr(game, "teams", modified_teams)
        flag_modified(game, "teams")

        session.commit()
        # 7. Return the updated teams
        return modified_teams


    except Exception as e:
        session.rollback()
        return {'message': 'set_game_scores(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def increment_score_attribute(game_hash: str, key: str, player_hash: str = None, amount: int = 1):
    if not game_hash or not key:
        raise Exception("increment_score_attribute(): insufficient arguments")
    session = get_session()
    try:
        game = session.execute(
            select(Games)
            .where(Games.hash == game_hash)
        ).scalars().first()

        game_dict = to_dict_safe(game, rel_depths=REL_DEP["db:game"], depth=0)
        teams = game_dict.get("teams")
        mutated_teams = teams

        for team_hash, team in teams.items():
            # If this is about points, then we need to increment the team score
            for p_hash, player in team["members"].items():
                # If there is no player_hash, then we want to do it for all of the members
                # Increment buzzes
                if player_hash:
                    if p_hash == player_hash:
                        # Specific to just the player/team
                        if key == "points":
                            mutated_teams[team_hash]["score"] += amount
                        mutated_teams[team_hash]["members"][p_hash][key] += amount
                        break
                else:
                    mutated_teams[team_hash]["members"][p_hash][key] += amount

        # 6. Set the teams in the database
        setattr(game, "teams", mutated_teams)
        flag_modified(game, "teams")

        session.commit()
        # 7. Return the updated teams
        return mutated_teams


    except Exception as e:
        session.rollback()
        return {'message': 'increment_score_attribute(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def write_user_stats(player_hash: str, stats: dict) -> dict:
    session = get_session()
    try:
        user = session.execute(
            select(Users)
            .where(Users.hash == player_hash)
            .options(
                joinedload(Users.stats)
            )
        ).scalars().first()

        all_stats = {};

        for key in list(stats.keys()):
            all_stats[key] = 0
            # Forget it if there is no change
            if stats[key] == 0:
                continue
            new_total = getattr(user.stats, key) + Decimal(stats.get(key))
            all_stats[key] = float(new_total)
            setattr(user.stats, key, new_total)

        session.commit()

        return all_stats

    except Exception as e:
        session.rollback()
        print(e)
        return {'message': 'write_user_stats(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def set_lobby_settings(lobbyAlias: str, settings: dict, user: dict) -> dict:
    if not user:
        return {"message": "User not passed", "code": 404}
    session = get_session()
    try:
        lobby = session.execute(
            select(Lobbies)
            .where(Lobbies.name == lobbyAlias)
        ).scalars().first()

        # Make sure the user can enter the lobby
        if lobby.creator_id != user.get("id") and user.get("username") != "admin":
            return {"message": "User lacks permission", "code": 401}
        
        columns = {}

        for column in MUTATABLE_RULES:
            if settings.get(column) is not None:
                # Translate the categories to its number code
                # TODO: Handle custom percentages for categories

                setattr(lobby, column, settings[column])
        
        session.commit()

        return {'message': 'set_lobby_settings(): success', "code": 200}
    except Exception as e:
        session.rollback()
        return {'message': 'create_lobby(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def edit_user(hash:str, data: dict):
    try:
        session = get_session()

        user = session.execute(
            select(Users)
            .where(Users.hash == hash)
        ).scalars().first()

        if not user:
            return {"message": "edit_user(): failure", "error": "User not found", "code": 404}
        
        for key, value in data.items():
            setattr(user, key, value)

        session.commit()

        return {"message": "edit_user(): success", "code": 200}

    except Exception as e:
        session.rollback()
        return {"message": "edit_user(): failure", "error": f"{e}", "code": 500}
    finally:
        session.remove()

def classify_question(hash: str, category: str) -> dict:
    try:
        session = get_session()

        question = session.execute(
            select(Questions)
            .where(Questions.hash == hash)
        ).scalars().first()

        if not question:
            return {"message": "classify_question(): failure", "error": "Question not found", "code": 404}
        
        setattr(question, "category", category)
        setattr(question, "category_confidence", 1)
        setattr(question, "hand_labeled", True)

        session.commit()

        count = session.execute(
            select(func.count())
            .select_from(Questions)
            .where(Questions.hand_labeled == True)
        ).scalar_one()

        return {"message": "classify_question(): success", "count": count, "code": 200}

    except Exception as e:
        session.rollback()
        return {"message": "classify_question(): failure","error": e, "code": 500}
    finally:
        session.remove()

def update_game_active_at(hash: str, active_at: datetime): 
    session = get_session()
    try:
        active_at_dt = datetime.fromisoformat(active_at)
        cutoff = datetime.utcnow() - timedelta(days=LOBBY_DELETE_DAYS - 2)

        # We don't need to update it then
        if (active_at_dt > cutoff):
            return


        game = session.execute(
            select(Games)
            .where(Games.hash == hash)
        ).scalars().first()

        setattr(game, "active_at", datetime.now(timezone.utc))

        session.commit()

        return {"message": "update_game_active_at(): success", "code": 200}

    except Exception as e:
        session.rollback()
        print(e)
        return {"message": "update_game_active_at(): failure","error": e, "code": 500}
    finally:
        session.remove()

def verify_email(email, code) -> dict:
    session = get_session()
    user = session.execute(
        select(Users)
        .where(Users.email == email)
    ).scalars().first()

    # If the user's email is already verified, tell them
    # This way, if the user's account is disabled they cant go throught the verification process again to re-enable it
    if user.email_verified:
        return {"error": "Email is already verified", "code": 400}

    # Check if it's expired
    if user.email_verification.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        return {"error": "Verification code is expired", "code": 400}
    
    if user.email_verification.code == code:
        user.account_disabled = False
        user.email_verified = True
        session.commit()
        # Return the user as well for the token generation process
        return {"message": "Successfully verified email", "user": to_dict_safe(user), "code": 200}
    else:
        return {"error": "Invalid verification code", "code": 401}
        


# DELETING RESOURCES

def reset_game_scores(game_hash: str) -> bool:
    session = get_session()
    try:
        game = session.execute(
            select(Games)
            .where(Games.hash == game_hash)
        ).scalars().first()

        setattr(game, "teams", {})

        session.commit()

        return {'message': 'reset_game_scores(): success', "code": 200}


    except Exception as e:
        session.rollback()
        return {'message': 'reset_game_scores(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def remove_user_game_scores(game_hash: str, player_hash: str):
    if not game_hash or not player_hash:
        raise Exception("remove_user_game_scores(): arguments undefined")
    
    session = get_session()
    try:
        game = session.execute(
            select(Games)
            .where(Games.hash == game_hash)
        ).scalars().first()

        game_dict = to_dict_safe(game, rel_depths=REL_DEP["db:game"], depth=0)
        teams = game_dict.get("teams")
        modified_teams = teams

        stats = None

        # Find the player stats based on the hash
        for team_hash in list(teams.keys()):
            if player_hash in list(teams[team_hash]["members"].keys()):
                stats = dict(teams[team_hash]["members"][player_hash])
                del modified_teams[team_hash]["members"][player_hash]

                # If there are no more players on this team, delete the team
                if len(list(modified_teams[team_hash]["members"].keys())) == 0:
                    del modified_teams[team_hash]

        setattr(game, "teams", modified_teams)
        flag_modified(game, "teams")
        session.commit()

        return stats

    except Exception as e:
        session.rollback()
        return {'message': 'get_lobby_by_alias(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def delete_inactive_lobbies():
    # TODO: We need to remove the Players table before this probably
    session = get_session()
    try:
        cutoff = datetime.utcnow() - timedelta(days=LOBBY_DELETE_DAYS)

        to_delete = session.execute(
            select(func.count())
            .select_from(Games)
            .where(Games.active_at < cutoff)
        ).scalar()

        # Delete inactive games
        # This will help when there are potentially a lot of games on common servers so that we don't get dead buildup
        session.execute(
            delete(Games)
            .where(
                Games.active_at < cutoff,
                ~Games.lobby.has(Lobbies.name.in_(PROTECTED_LOBBIES))
            )
        )

        to_delete_lobbies = session.execute(
            select(func.count())
            .select_from(Lobbies)
            .where(
                ~Lobbies.games.any(),                 # no gamess exist
                ~Lobbies.name.in_(PROTECTED_LOBBIES)  # not protected
            )
        ).scalar()

        # Now delete lobbies with no games
        session.execute(
            delete(Lobbies).where(
                ~Lobbies.games.any(),                 # no gamess exist
                ~Lobbies.name.in_(PROTECTED_LOBBIES)  # not protected
            )
        )

        session.commit()

        print(f"Deleted {to_delete} games and {to_delete_lobbies} lobbies")

        return {'message': 'delete_inactive_lobbies(): success', "code": 200}

    except Exception as e:
        session.rollback()
        print(e)
        return {'message': 'delete_inactive_lobbies(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def remove_friend_by_hash(from_hash: str, to_hash: str) -> dict:
    session = get_session()
    try:
        user = get_user_by_hash(from_hash)
        target = get_user_by_hash(to_hash)

        # See if there is already a friend request
        friend = session.execute(
            select(Friends)
            .where(
                or_(
                    and_(Friends.sender_id == user.get("id"), Friends.receiver_id == target.get("id")),
                    and_(Friends.sender_id == target.get("id"), Friends.receiver_id == user.get("id")),
                )
            )
        ).scalars().first()

        if not friend:
            return {'message': "You are not friends with " + target.get("username"), "code": 400}

        session.delete(friend)
        session.commit()

        return {'message': 'Unfriended ' + target.get("username"), "code": 200}
    except Exception as e:
        session.rollback()
        return {'message': 'remove_friend_by_hash(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def unsave_question(hash: str, question_hash: str) -> bool:
    session = get_session()
    try:
        user = get_user_by_hash(hash)
        question = get_question_by_hash(question_hash)

        # See if there is already a friend request
        question = session.execute(
            delete(SavedQuestions)
            .where(
                SavedQuestions.user_id == user.get("id"),
                SavedQuestions.question_id == question.get("id"),
                SavedQuestions.saved_type == "saved"
            )
        )

        session.commit()

        return {'message': "Question unsaved", "code": 200}
    except Exception as e:
        session.rollback()
        return {'message': 'unsave_question(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()


# =====GAME FUNCTIONS=====

# Question checking
# Return -1 for incorrect, 0 for prompt, and 1 for correct
# We want to this to be loose rather than tight. It is more frustrating for players to have a correct answer denied than the rare occasion that a in inccorect answer is accepted
# In short, we prefer false positives over false negatives
def check_question(question, guess, bonus_number=-1) -> bool:
    # Return wrong if there is no answer
    if not question or not guess:
        return -1
    
    is_bonus = question.get("type") == 1 and bonus_number >= 0 and bonus_number < 3
    
    # Tokenize answer
    answers = question.get("answers")
    # If it's a bonus we need to split the answer parts by |||
    if is_bonus:
        answers = answers.split(" ||| ")[bonus_number]

    # Parse answer segments
    # If the answer segment
    main_answer, accepts, prompts, rejects = [segment if segment != "NONE" and segment != "" else None for segment in answers.split(" || ")[0:4]]

    is_correct = False
    is_prompt = False
    is_reject = False

    # If the answer similarity is > 0.7 but less than the threshold we will then prompt due to spelling
    correct_threshold = 0.90
    prompt_threshold = 0.85
    dont_accept_threshold = 0.90

    corrects = [main_answer, *(accepts.split(" | ") if accepts else [])]
    mean_correct_length = reduce(lambda acc, correct: acc + len(correct), corrects, 0) // len(corrects)

    # CORRECT
    for answer in corrects:
        # Dynamic thresholds
        # The longer the answer is, the lower the threshold (more typos, etc)
        is_correct = normal_match(answer, guess, threshold=correct_threshold - mean_correct_length * 0.005)
        if is_correct == 1:
            return 1

    # DON'T DO REJECTS
    # We want a very high theshold on this
    # # DON'T ACCEPT
    # for reject in [*(rejects.split(" | ") if rejects else [])]:
    #     if is_name:
    #         is_reject = name_match(reject, guess, threshold=dont_accept_threshold)
    #     else:
    #         is_reject = normal_match(reject, guess, threshold=dont_accept_threshold)
    #     if is_reject:
    #         return -1
    
    # If the answer is iffy, being mispelled or not quite matching up
    if is_correct < correct_threshold and is_correct > prompt_threshold:
        return 0
            
    # Last ditch to see if the user's answer can get a prompt
    for prompt in [*(prompts.split(" | ") if prompts else [])]:
        is_prompt = normal_match(prompt, guess, threshold=prompt_threshold)
        if is_prompt:
            return 0
        
    # Return incorrect
    return -1

# If the answer is in the range of 0.7 - threshold, then we will prompt
def normal_match(answer: str, guess: str, threshold=0.85):
    guess = guess.lower()
    answer = answer.lower()
    if len(guess) < max(2, len(answer) // 2):  # guess must be at least half the length of answer or 2 characters
        return 0
    
    similarity = jellyfish.jaro_winkler_similarity(answer, guess)
    if similarity >= threshold:
        return 1
    
    highest_similarity = similarity;
    
    # If the guess is longer than the answer by a resonable amount and it contains the answer, say yes
    for guess_word in guess.split():
        similarity = jellyfish.jaro_winkler_similarity(answer, guess_word)
        if similarity >= threshold:
            return 1
        elif similarity > highest_similarity:
            highest_similarity = similarity

    return highest_similarity

def answer_is_name(answer: str) -> bool:
    if not answer:
        return False

    # Get rid of "Accept:"s and "[]" stuff
    answer = strip_answerline_junk(answer)

    # Reject if contains digits (except Roman numerals as last token)
    tokens = answer.split()
    if any(char.isdigit() for char in answer):
        return False

    if len(tokens) > 5:
        return False

    # Strong negative signal: grammatical glue words
    if any(t.lower() in {"of", "and", "the", "for", "to", "with"} for t in tokens):
        return False

    score = 0

    # Token count: names cluster tightly
    if 1 <= len(tokens) <= 4:
        score += 2

    # Capitalization pattern (very strong)
    capitalized = sum(t[0].isupper() for t in tokens if t)
    if capitalized == len(tokens):
        score += 3
    elif capitalized >= len(tokens) - 1:
        score += 2

    # Roman numeral suffix (Henry VIII)
    if ROMAN_NUMERAL.match(tokens[-1]):
        score += 2

    # Shortenability test (CRITICAL)
    if len(tokens) >= 2:
        shortened = tokens[-1]
        if shortened[0].isupper():
            score += 3

    # Single-token names must be capitalized
    if len(tokens) == 1 and tokens[0][0].isupper():
        score += 2

    return score >= 5

def strip_answerline_junk(answer: str) -> str:
    if not answer:
        return ""

    s = answer.strip()

    # Remove bracketed instructions
    s = BRACKETED.sub("", s)

    # Remove parenthetical notes
    s = PARENTHETICAL.sub("", s)

    # Remove leading judging directives
    s = LEADING_DIRECTIVES.sub("", s)

    # Remove trailing commentary
    s = TRAILING_DIRECTIVES.sub("", s)

    # Normalize whitespace
    s = re.sub(r"\s+", " ", s)

    return s.strip()

# Game state management

def user_join_lobby(hash, lobbyAlias):
    session = get_session()
    try:
        lobby = session.execute(
            select(Lobbies)
            .where(Lobbies.name == lobbyAlias)
        ).scalars().first()

        lobby_games = session.execute(
            select(Games)
            .where(Games.lobby_id == lobby.id)
        ).scalars().all()

        user = session.execute(
            select(Users)
            .where(
                Users.hash == hash,
            )
        ).scalars().first()

        if not user:
            return {'message': 'user_join_lobby(): failure', 'error': f'User not found', "code": 400}

        if not lobby_games:
            # If there is no game, create a game
            game = Games(
                lobby_id=lobby.get("id"),
                teams={},
                rounds=[]
            )
            session.add(game)
            
            session.commit()

            lobby_games = [game]


        # Set the uesrs's lobby to this lobby
        setattr(user, "current_lobby_id", lobby.id)

        # TODO: If a game is non-custom and that game is full, add them to another game

        game = None

        # Add them to a specific game
        if len(lobby_games) == 1:
            game = lobby_games[0]
        else:
            # TODO: Handle putting the player into a seperate lobby
            return

        setattr(user, "current_game_id", game.id)

        session.commit()

        return {'message': 'user_join_lobby(): success', "code": 200}
    except Exception as e:
        session.rollback()
        return {'message': 'user_join_lobby(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def user_disconnect_from_lobby(hash):
    session = get_session()
    try:
        user = session.execute(
            select(Users)
            .where(
                Users.hash == hash,
            )
        ).scalars().first()

        if not user:
            return {'message': 'user_disconnect_from_lobby(): failure', 'error': f'User not found', "code": 400}

        setattr(user, "current_game_id", None)
        setattr(user, "current_lobby_id", None)

        session.commit()

        return {'message': 'user_disconnect_from_lobby(): success', "code": 200}
    except Exception as e:
        session.rollback()
        return {'message': 'user_disconnect_from_lobby(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def set_question_to_game(question, lobbyAlias):
    session = get_session()
    try:
        # Assuming every lobby only has one game
        game = session.execute(
            select(Games)
            .join(Lobbies, Games.lobby_id == Lobbies.id)
            .where(Lobbies.name == lobbyAlias)
        ).scalars().first()

        if not game:
            return {'message': 'set_question_to_game(): failure', 'error': f'Game not found', "code": 400}

        setattr(game, "current_question_id", question.get("id"))

        session.commit()

        return {'message': 'set_question_to_game(): success', "code": 200}
    except Exception as e:
        session.rollback()
        return {'message': 'set_question_to_game(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()


# ===== RANKED SYSTEM =====

def update_rank(user_hash: str, question: dict, is_correct: bool, buzz_fraction: float, is_non_answer: bool = False) -> dict:
    session = get_session()
    try:
        # Get data to start
        user = get_user_by_hash(user_hash, rel_depths={"stats": 0})
        rating_params = get_rating_params()

        stats = session.execute(
            select(Stats)
            .where(Stats.user_id == user.get("id"))
        ).scalars().first()

        # Load global skill
        g = ranked.Skill(stats.skill_mu, stats.skill_sigma)

        # Load category skill
        category_skill = session.execute(
            select(UserCategorySkill)
            .where(
                UserCategorySkill.user_id == user.get("id"),
                UserCategorySkill.category_code == get_category_code(question.get("category").lower())
            )
        ).scalars().first()
        # If there isn't category skill, then we need to create one
        if not category_skill:
            category_skill = UserCategorySkill(
                user_id=user.get("id"),
                category_code=get_category_code(question.get("category")),
                questions_seen=1
            )

            session.add(category_skill)
            session.flush()

        # Category skill
        c = ranked.Skill(category_skill.mu, category_skill.sigma)
        # Calculate effective skill by combining the user's overall and category skill
        effective_skill = ranked.effective_skill(g, c, global_weight=rating_params.alpha)

        # Load question difficulty
        q = ranked.Difficulty(question.get("difficulty_mu"), question.get("difficulty_sigma"), buzz_fraction=buzz_fraction)

        # Compute updated_skill
        updated = None
        if is_non_answer:
            updated = ranked.update_skill(effective_skill, q, False, 1, beta=rating_params.beta)
            # updated = ranked.non_answer_update_skill(effective_skill, q, buzz_fraction=buzz_fraction, beta=rating_params.beta, power=rating_params.time_penalty, max_mu_drop=rating_params.max_mu_drop)
        else:
            updated = ranked.update_skill(effective_skill, q, bool(is_correct > 0), buzz_fraction, beta=rating_params.beta)

        # Throttle for not seeing a ton of questions
        cat_conf = min(1.0, category_skill.questions_seen / 20)
        # Rating_params.alpha is the proportion that goes towards global skill
        WEIGHT = rating_params.alpha / 2 + rating_params.alpha / 2 * (1 - cat_conf)

        # Calculate deltas (this is fine)
        delta_mu = updated.mu - effective_skill.mu
        delta_sigma = updated.sigma - effective_skill.sigma

        print("DELTA MU", delta_mu)
        print("DELTA SIGMA", delta_sigma)

        # Update global and category skills (this is fine)
        g_new = ranked.Skill(g.mu, g.sigma)
        g_new.mu += WEIGHT * delta_mu
        g_new.sigma = max(1.0, g_new.sigma + WEIGHT * delta_sigma)

        c_new = ranked.Skill(c.mu, c.sigma)
        c_new.mu += (1 - WEIGHT) * delta_mu
        c_new.sigma = max(1.0, c_new.sigma + (1 - WEIGHT) * delta_sigma)

        # After calculating g_new and c_new, add:
        print(f"WEIGHT: {WEIGHT}")
        print(f"Global skill BEFORE: mu={g.mu}, sigma={g.sigma}")
        print(f"Global skill AFTER: mu={g_new.mu}, sigma={g_new.sigma}")
        print(f"Category skill BEFORE: mu={c.mu}, sigma={c.sigma}")
        print(f"Category skill AFTER: mu={c_new.mu}, sigma={c_new.sigma}")
        print("=" * 50)

        # Save the updated score to the database
        setattr(stats, "skill_mu", g_new.mu)
        setattr(stats, "skill_sigma", g_new.sigma)
        setattr(stats, "last_active_at", datetime.now(timezone.utc))

        setattr(category_skill, "mu", c_new.mu)
        setattr(category_skill, "sigma", c_new.sigma)
        setattr(category_skill, "questions_seen", category_skill.questions_seen + 1)

        # Update question difficulty
        updated_question = ranked.update_question_difficulty(q, updated, is_correct, buzz_fraction, beta=rating_params.beta, power=rating_params.time_penalty, min_sigma=rating_params.q_min_sigma)

        # TODO: MAKE SURE UPDATING QUESTION IS ACURATE 

        # Update question
        # question = session.execute(
        #     select(Questions)
        #     .where(Questions.hash == question.get("hash"))
        # ).scalars().first()

        # setattr(question, "difficulty_mu", updated_question.mu)
        # setattr(question, "difficulty_sigma", updated_question.sigma)

        session.commit()

        # Get and display the user's new skill level
        new_skill = ranked.Skill(stats.skill_mu, stats.skill_sigma)
        new_cat_rank = ranked.get_rank(
            ranked.Skill(category_skill.mu, category_skill.sigma)
        )

        new_user_rank = ranked.get_rank(new_skill)
        rank_change = ranked.skill_diff(g, new_skill)

        # Update the user's new rank and rr
        setattr(stats, "visible_rank", new_user_rank.rank)
        setattr(stats, "rank_points", new_user_rank.rr)

        session.commit()

        user = get_user_by_hash(user_hash, {"stats": 0})

        return {'message': 'update_rank(): success', "user": {"hash": user.get("hash"), "rank": new_user_rank.to_dict(), "rank_change": rank_change, "category_rank": new_cat_rank.to_dict()}, "code": 200}
    except Exception as e:
        session.rollback()
        print(e)
        return {'message': 'update_rank(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def ranked_on_next_question(game_m: dict, emit):
            # The user not answering (at least at any point in the question if someone got us early) tells us that the user does not know the answer to the question at that timestep
        
        # Handle no interrupts
        interrupts = game_m.get("question_interrupts") or [{"proportion_through": 1.0}]
        proportion_through = interrupts[-1].get("proportion_through")


        interruptor_hashes = {
            interrupt.get("user", {}).get("hash")
            for interrupt in game_m.get("question_interrupts", [])
            if interrupt.get("user", {}).get("hash") is not None
        }

        non_answering_users = [
            user_hash
            for user_hash in game_m.get("users", {}).keys()
            if user_hash not in interruptor_hashes
        ]

        for user_hash in non_answering_users:
            # Assume every question is read to completion
            result = update_rank(user_hash, game_m.get("current_question"), is_correct=False, buzz_fraction=1, is_non_answer=True)
            rank_change_information = result.get("user")

            if rank_change_information:
                emit("rank_changed", rank_change_information, room=f"user:{rank_change_information.get("hash")}")

def reset_user_ranks():
    session = get_session()
    rating_params = get_rating_params()

    # Remove stats
    session.execute(
        update(Stats)
        .values(
            skill_mu=rating_params.initial_mu,
            skill_sigma=rating_params.initial_sigma
        )
    )

    # Remove category stats
    session.execute(
        delete(UserCategorySkill)
    )

    session.commit()

    print(f"Successfully reset ranks to values: mu={rating_params.initial_mu}, sigma={rating_params.initial_sigma}")

def reset_question_difficulties():
    session = get_session()

    level_difficulties = ranked.QUESTION_DIFFICULTIES

    for level in level_difficulties.keys():
        data = level_difficulties[level]
        session.execute(
            update(Questions)
            .values(
                difficulty_mu=data.get("mu"),
                difficulty_sigma=data.get("sigma")
            )
            .where(Questions.level == level)
        )

    session.commit()

    print(f"Successfully question difficulties")
    

# reset_user_ranks()
# reset_question_difficulties()

# =====SANITATION AND VALIDATION=====

# Account creation
def validate_password(password):
    # Conditions
    length_condition = 8 <= len(password) <= 20
    uppercase_condition = re.search(r'[A-Z]', password) is not None
    lowercase_condition = re.search(r'[a-z]', password) is not None
    digit_condition = re.search(r'\d', password) is not None
    special_character_condition = re.search(r'[!@#$%^&*(),.?":{}|<>]', password) is not None
    
    # Check conditions and return feedback
    errors = []
    if not length_condition:
        errors.append("Password must be between 8 and 20 characters.")
    if not uppercase_condition:
        errors.append("Password must contain at least one uppercase letter.")
    if not lowercase_condition:
        errors.append("Password must contain at least one lowercase letter.")
    if not digit_condition:
        errors.append("Password must contain at least one digit.")
    if not special_character_condition:
        errors.append("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>).")
    
    if errors:
        raise ValueError(errors[0])
    return password

def validate_password_hash(password):
    # They might not have a password if they log in with Google
    if password is None:
        return ""

    bcrypt_regex = r"^\$2[abxy]?\$\d{2}\$[./A-Za-z0-9]{53}$"

    if bool(re.match(bcrypt_regex, password)):
        return password
    else:
        raise ValueError("Password is an invalid hash.")

def validate_email(email):
    # Simple regex to validate and sanitize email format
    if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email):
        raise ValueError("Email is of invalid format.")
    
    # Check our database and check if the email is already taken
    session = get_session()

    result = session.execute(select(Users).where(Users.email == email)).scalars().first()

    if result is not None:
        raise ValueError("Email is taken.")
    
    return email

def validate_username(username): 
    # Check our database and check if the email is already taken
    session = get_session()

    result = session.execute(select(Users).where(Users.username == username)).scalars().first()

    if result is not None:
        raise ValueError("Username is taken.")
    
    return username

validation_list = {
    "email": validate_email,
    "password": validate_password_hash,
}
