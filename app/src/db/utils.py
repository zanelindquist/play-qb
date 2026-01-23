# Import all of our models
from .models import *

import html
from datetime import datetime, timezone, timedelta, date
import re
import math
import random
from decimal import Decimal
from difflib import SequenceMatcher

from sqlalchemy import select, or_, and_, not_, delete, func, desc, literal, case, exists
from sqlalchemy.orm import scoped_session, sessionmaker, joinedload, class_mapper, subqueryload
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.inspection import inspect
from .data_structures import SERIALIZATION_CONFIG, RELATIONSHIP_DEPTHS_BY_ROUTE as REL_DEP

from .db import engine
from .models.hash import *

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
    "everything",
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
PROTECTED_LOBBIES = ["solos", "duos", "trios", "squads", "5v5"]

# Cleaning up database
LOBBY_DELETE_DAYS = 0

def normalize(s: str) -> str:
    text = re.sub(r"\s+", " ", s.lower().strip())

    # Remove common meaningless words
    text = " ".join([w for w in text.split(" ") if w not in COMMON_WORDS])

    return text

def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


# Database session
Session = scoped_session(sessionmaker(bind=engine))

def get_session():
    return Session

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
        return
    
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



# CREATING RESOURCES

def create_user(data):

    try:
        data["email"] = validate_email(data.get("email"))
        data["password"] = validate_password_hash(data.get("password"))
    except Exception as e:
        return {'message': 'create_user(): failure', "code": 400, "error": e}

    try:
        session = get_session()

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

        return {'message': 'create_user(): success', "code": 201}
    
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

# create_stat_for_all_users_temp()


# Creates a game by default for this lobby
def create_lobby(settings):
    session = get_session()
    try:
        lobby = get_lobby_by_alias(settings.get("name"))

        if lobby:
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

def create_friend_request_from_email_to_hash(email, hash):
    session = get_session()
    try:
        user = get_user_by_email(email)
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
        return {'message': 'create_friend_request_from_email_to_hash(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def save_question(question_id, user_id, category="missed"): # category= missed, correct, saved
    session = get_session()
    try:
        saved_question = session.execute(
            select(SavedQuestions)
            .where(
                and_(
                    SavedQuestions.id == question_id,
                    SavedQuestions.user_id == user_id,
                    SavedQuestions.category == category
                )
            )
        ).scalars().first()

        if saved_question:
            return {'message': 'save_question(): that question is already saved', "code": 403}
        

        new_saved_question = SavedQuestions(
            question_id=question_id,
            user_id=user_id,
            category=category
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

def get_user_by_email(email, gentle=True, advanced=False, joinedloads=False, rel_depths=None, depth=0):
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

def get_user_by_hash(hash, gentle=True, advanced=False, joinedloads=False, rel_depths=None, depth=0):
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
        print(e)
        return None
    finally:
        session.remove()

def get_random_question(type=0, level=0, category="all", confidence_threshold=0.1, hand_labeled=False):
    session = get_session()

    try:
        base_query = (
            select(Questions)
            .where(Questions.category_confidence >= confidence_threshold)
            .where(Questions.type == type)
        )

        # Optional filters (only apply if non-zero / non-null)
        if level != 0:
            base_query = base_query.where(Questions.level == level)

        if category != "everything":
            # TODO: Handle custom

            base_query = base_query.where(Questions.category == category)

        if hand_labeled:
            base_query = base_query.where(Questions.hand_labeled == False)

        # Count filtered rows
        count = session.execute(
            select(func.count()).select_from(base_query.subquery())
        ).scalar()

        if count == 0:
            return {
                "code": 404,
                "error": "No questions meet this query"
            }

        # Pick random offset
        offset = random.randint(0, count - 1)

        question = session.execute(
            base_query.offset(offset).limit(1)
        ).scalars().first()

        q = to_dict_safe(question, depth=0)

        parsed_answers = {}
        keys = ["main", "accept", "prompt", "reject", "suggested_category"]
        index = 0;
        for part in q.get("answers").split(" || "):
            parsed_answers[keys[index]] = part.split(" | ") if part != "NONE" else None
            index += 1

        # Make the main answer not a list
        parsed_answers["main"] = parsed_answers["main"][0]

        # Parse answer
        q["answers"] = parsed_answers

        return q


    except Exception as e:
        return {"code": 400, "error": str(e)}

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

def get_friends_by_email(email, online=False, party=False):
    session = get_session()

    if not email:
        raise Exception("get_friends_by_email(): No email provided")
    
    user = session.execute(
        select(Users)
        .where(Users.email == email)
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

def get_friend_requests_by_email(email):
    session = get_session()

    if not email:
        raise Exception("get_friends_by_email(): No email provided")
    
    user = session.execute(
        select(Users)
        .where(Users.email == email)
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

def get_stats_by_email(email: str) -> list:
    session = get_session()
    try:
        user = session.execute(
            select(Users)
            .where(Users.email == email)
        ).scalars().first()

        if not user:
            return False;

        return to_dict_safe(user.stats, rel_depths=REL_DEP["db:stat"])

    except Exception as e:
        session.rollback()
        return {'message': 'get_stats_by_email(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def get_saved_questions(email, saved_type="all", category="all", offset=0, limit=20):
    try:
        session = get_session()
        
        user = session.execute(
            select(Users)
            .where(Users.email == email)
        ).scalars().first()

        where_clauses = [SavedQuestions.user_id == user.id]

        if saved_type != "all":
            where_clauses.append(SavedQuestions.saved_type == saved_type)

        # Build base statement with all filters
        base_stmt = select(SavedQuestions).where(*where_clauses)

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
                parsed_answers[keys[index]] = part.split(" | ") if part != "NONE" else None
                index += 1

            # Make the main answer not a list
            parsed_answers["main"] = parsed_answers["main"][0]

            # Parse answer
            q["answers"] = parsed_answers
            q["saved_type"] = sq.saved_type

            parsed.append(q)

        return {"questions": parsed, "total": total}

    except Exception as e:
        print(e)
        return {'message': 'get_saved_questions(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.remove()



# EDITING RESOURCES

def set_user_online(email: str, online=True):
    try:
        session = get_session()

        user = session.execute(
            select(Users)
            .where(Users.email == email)
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
            "questions_encountered": 0
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
            new_total = getattr(user.stats, key) + stats.get(key)
            all_stats[key] = new_total
            setattr(user.stats, key, new_total)

        session.commit()

        return all_stats

    except Exception as e:
        session.rollback()
        return {'message': 'write_user_stats(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def set_lobby_settings(lobbyAlias: str, settings: dict) -> dict:
    session = get_session()
    try:
        lobby = session.execute(
            select(Lobbies)
            .where(Lobbies.name == lobbyAlias)
        ).scalars().first()
        
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

def edit_user(email:str, data: dict):
    try:
        session = get_session()

        user = session.execute(
            select(Users)
            .where(Users.email == email)
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
    return;
    session = get_session()
    try:
        cutoff = datetime.utcnow() - timedelta(days=LOBBY_DELETE_DAYS)

        print("cutoff:", cutoff)
        print("min active_at:", session.execute(
            select(func.min(Games.active_at))
        ).scalar())

        # Delete inactive games
        games = session.execute(
            delete(Games)
            .where(Games.active_at <= cutoff)
        )

        # Now delete lobbies with no games
        session.execute(
            delete(Lobbies).where(
                ~Lobbies.games.any(),                 # no gamess exist
                ~Lobbies.name.in_(PROTECTED_LOBBIES)  # not protected
            )
        )

        session.commit()

        return stats

    except Exception as e:
        session.rollback()
        print(e)
        return {'message': 'get_lobby_by_alias(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def remove_friend_by_email_to_hash(email: str, hash: str) -> dict:
    session = get_session()
    try:
        user = get_user_by_email(email)
        target = get_user_by_hash(hash)

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
        return {'message': 'create_friend_request_from_email_to_hash(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()


# =====GAME FUNCTIONS=====

# Question checking
# TODO: ADD PROMPTING
# Return -1 for incorrect, 0 for prompt, and 1 for correct
# We want to this to be loose rather than tight. It is more frustrating for players to have a correct answer denied than the rare occasion that a in inccorect answer is accepted
# In short, we prefer false positives over false negatives
def check_question(question, guess) -> bool:
    if not question or not guess:
        raise Exception("check_question(): no question or guess provided")

    # Handle bonuses
    if question.get("type") == 1:
        return -1
    
    # Handle tossups

    # Tokenize answer
    answers = question.get("answers")

    is_correct = False
    is_prompt = False
    is_reject = False

    # If the answer similarity is > 0.7 but less than the threshold we will then prompt due to spelling
    correct_threshold = 0.7
    prompt_threshold = 0.6
    dont_accept_threshold = 0.85

        # Parse parts of answer
    main_answer, accepts, prompts, rejects, suggested_category = answers.split(" || ")
    # If the answer is longer than like 4 words, then its probably poisoned data, and well just go off of the first word, but with a much lower acceptance threshold
    if len(main_answer.split(" ")) > 4:
        main_answer = main_answer.split(" ")[0]
        correct_threshold = 0.4
        prompt_threshold = 0.3
    is_name = answer_is_name(main_answer)

    # We want a very high theshold on this
    # DON'T ACCEPT
    for reject in [*(rejects.split(" | ") if rejects != "NONE" else [])]:
        if is_name:
            is_reject= name_match(reject, guess, threshold=dont_accept_threshold)
        else:
            is_reject = normal_match(reject, guess, threshold=dont_accept_threshold)
        if is_reject:
            return -1
 
    # CORRECT
    for answer in [main_answer, *(accepts.split(" | ") if accepts != "NONE" else [])]:
        if is_name:
            is_correct = name_match(answer, guess, threshold=correct_threshold)
        else:
            is_correct = normal_match(answer, guess, threshold=correct_threshold)
        if is_correct == 1:
            return 1
        
    if is_correct < correct_threshold and is_correct > prompt_threshold:
        return 0
            
    for prompt in [*(prompts.split(" | ") if prompts != "NONE" else [])]:
        if is_name:
            is_prompt = name_match(prompt, guess, threshold=prompt_threshold)
        else:
            is_prompt = normal_match(prompt, guess, threshold=prompt_threshold)
        if is_prompt:
            return 0
        
    return -1

# If the answer is in the range of 0.7 - threshold, then we will prompt
def name_match(answer: str, guess: str, threshold=0.88):
    if not answer or not guess:
        return 0

    answer_norm = normalize(answer)
    guess_norm = normalize(guess)

    answer_tokens = list(answer_norm)
    guess_tokens = list(guess_norm)

    highest_sim = similarity(answer_norm, guess_norm)

    # Exact or near-exact match
    if similarity(answer_norm, guess_norm) >= threshold:
        return 1

    # Last-name-only rule
    if len(answer_tokens) >= 2:
        last_name = normalize(answer).split(" ")[-1]
        last_name_tokens = list(last_name)
        last_name_sim = similarity(last_name_tokens, guess_norm)
        if last_name_sim >= threshold:
            return 1
        elif last_name_sim >= 0.7:
            if last_name_sim > highest_sim:
                highest_sim = last_name_sim
            return highest_sim

    # Full token overlap (order-insensitive)
    overlap = set(answer_tokens) & set(guess_tokens)
    if len(overlap) >= len(answer_tokens) - 1:
        return 1

    return 0

# If the answer is in the range of 0.7 - threshold, then we will prompt
def normal_match(answer: str, guess: str, threshold=0.85):
    if not answer or not guess:
        return 0
    
    answer_norm = normalize(answer)
    guess_norm = normalize(guess)

    answer_tokens = set(list(answer_norm))
    guess_tokens = set(list(guess_norm))

    # Can't divide by 0 later, so if there are no tokens in the answer for some reason, give them the question
    if len(answer_tokens) == 0:
        return 0

    # Exact match
    if answer_norm == guess_norm:
        return 1

    # Require most tokens to be present
    overlap = answer_tokens & guess_tokens
    token_coverage = len(overlap) / len(answer_tokens)

    if token_coverage < 0.7:
        return 0

    # Guard against over-short guesses
    if len(guess_tokens) < len(answer_tokens) - 1:
        return 0

    # Final fuzzy check (conservative)
    sim = similarity(answer_norm, guess_norm)
    return 1 if sim >= threshold else sim if sim >= 0.7 else 0

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

def user_join_lobby(email, lobbyAlias):
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
                Users.email == email,
            )
        ).scalars().first()

        if not user:
            return {'message': 'user_join_lobby(): failure', 'error': f'User not found', "code": 400}

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

def user_disconnect_from_lobby(email):
    session = get_session()
    try:
        user = session.execute(
            select(Users)
            .where(
                Users.email == email,
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

    result = session.execute(select(Users).where(Users.email == email)).first()
    if result is not None:
        raise ValueError("Email is taken.")
    
    return email

def validate_username(email):
    # Simple regex to validate and sanitize email format
    if not re.match(r"\s", email):
        raise ValueError("Email is of invalid format.")
    
    # Check our database and check if the email is already taken
    session = get_session()

    result = session.execute(select(Users).where(Users.email == email)).first()
    if result is not None:
        raise ValueError("Email is taken.")
    
    return email

validation_list = {
    "email": validate_email,
    "password": validate_password_hash,
}
