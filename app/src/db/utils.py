# Import all of our models
from .models import *

import html
from datetime import datetime, timezone, timedelta, date
import re
import math
import random
from decimal import Decimal
from difflib import SequenceMatcher

from sqlalchemy import select, or_, and_, not_, delete, func, desc, literal, case
from sqlalchemy.orm import scoped_session, sessionmaker, joinedload, class_mapper, subqueryload
from sqlalchemy.inspection import inspect
from .data_structures import SERIALIZATION_CONFIG, RELATIONSHIP_DEPTHS_BY_ROUTE as REL_DEP

from .db import engine

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

def normalize(s: str) -> str:
    return re.sub(r"\s+", " ", s.lower().strip())

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

def to_dict_safe(obj, depth=1, gentle=True, rel_depths=None):
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



# CREATING RESOURCES

def create_user(client_data, rel_depths=None, depth=1):
    global sanitize_data
    sanitized_data = sanitize_data(data=client_data)
    try:
        sanitized_data = validate_data(sanitized_data)
    except Exception as e:
        print(e)
        return {'message': 'create_user(): failure', "code": 400, "error": f"{e}"}

    new_user = Users(
        **sanitized_data
    )

    try:
        session = get_session()

        session.add(new_user)
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

def create_lobby(lobbyAlias):
    session = get_session()
    try:
        lobby = get_lobby_by_alias(lobbyAlias)

        if lobby:
            return {'message': 'create_lobby(): lobby already exists', "code": 400}

        lobby = Lobbies(
            name=lobbyAlias
        )
        session.add(lobby)
        session.flush()

        # Make sure each lobby has a game
        game = Games(
            lobby_id=lobby.id
        )
        session.add(game)
        
        session.commit()

        return {'message': 'create_lobby(): success', "code": 200}
    except Exception as e:
        session.rollback()
        return {'message': 'create_lobby(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

def create_player(email, lobbyAlias):
    session = get_session()
    try:
        player = get_player_by_email_and_lobby(email, lobbyAlias)
        user = get_user_by_email(email)
        lobby = get_lobby_by_alias(lobbyAlias)

        if player is not None:
            return {'message': 'Player already exists', "code": 409}

        if not user or not lobby:
            return {'message': 'User or lobby not found', "code": 404}
        # Create stats for the player

        # For the current game, we want to set it as the lobby's last game
        game_id = 0;
        for game in lobby["games"]:
            if game["id"] > game_id:
                game_id = game["id"]

        player = Players(
            name=user["firstname"] + " " + user["lastname"],
            user_id=user["id"],
            lobby_id=lobby["id"],
            current_game_id=game_id
        )

        session.add(player)
        session.flush()

        stats = Stats(
            player_id=player.id
        )

        session.add(stats)
        session.commit()

        return {'message': 'create_player(): success', "code": 200}
    except Exception as e:
        session.rollback()
        return {'message': 'create_player(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

# RETRIEVING RESOURCES

# All of thse functions must return dicts, not SQL Alchemy objects

def get_user_by_email(email, gentle=True, advanced=False, joinedloads=False, rel_depths=None, depth=0):
    try:
        session = get_session()
        user = None
        if not joinedloads: 
            user = session.execute(
                select(Users)
                .where(Users.email == email)
            ).scalars().first()
        else:
            user = session.execute(
                select(Users)
                .where(Users.email == email)
                .options(
                    joinedload(Users.player_instances),
                )
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

def get_random_question(level=False, type=0, difficulty=False, subject=False, confidence_threshold=0.1):
    session = get_session()

    try:
        base_query = (
            select(Questions)
            .where(Questions.category_confidence >= confidence_threshold)
            .where(Questions.type == type)
        )

        # Optional filters (only apply if non-zero / non-null)
        if level:
            base_query = base_query.where(Questions.level == level)

        if difficulty:
            base_query = base_query.where(Questions.difficulty == difficulty)

        if subject:
            base_query = base_query.where(Questions.category == subject)

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

        return to_dict_safe(question, depth=0)

    except Exception as e:
        return {"code": 400, "error": str(e)}

def get_player_by_email_and_lobby(email, lobbyAlias, rel_depths=REL_DEP["db:player"]):
    try:
        session = get_session()

        lobby = session.execute(
            select(Lobbies)
            .where(Lobbies.name == lobbyAlias)
        ).scalars().first()

        player = session.execute(
            select(Players)
            .join(Users)
            .where(
                Users.email == email,
                Players.lobby_id == lobby.id
            )
            .options(
                joinedload(Players.user),
            )
        ).scalars().first()

        return to_dict_safe(player, rel_depths=rel_depths)
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

def get_gamestate_by_lobby_alias(lobbyAlias):
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
        return {'message': 'get_gamestate_by_lobby_alias(): failure', 'error': f'{e}', "code": 400}
    finally:
        session.commit()

# =====GAME FUNCTIONS=====

# Question checking
# TODO: ADD PROMPTING
def check_question(question, guess) -> bool:
    if not question or not guess:
        raise Exception("check_question(): no question provided")

    # Handle bonuses
    if question.get("type") == 1:
        return False
    
    # Handle tossups

    # Tokenize answer
    answers = question.get("answers")

    # Parse parts of answer
    main_answer, accepts, prompts, rejects, suggested_category = answers.split(" || ")
    # If the answer is longer than like 4 words, then its probably poisoned data, and well just go off of the first word
    if len(main_answer.split(" ")) > 4:
        main_answer = main_answer.split(" ")[0]
    is_name = answer_is_name(main_answer)

    is_correct = False

    for answer in [main_answer, *(accepts.split(" | ") if accepts != "NONE" else [])]:
        if is_name:
            is_correct = name_match(answer, guess)
        else:
            is_correct = normal_match(answer, guess)
        if is_correct:
            break
        
    return is_correct

def name_match(answer: str, guess: str) -> bool:
    if not answer or not guess:
        return False

    answer_norm = normalize(answer)
    guess_norm = normalize(guess)

    answer_tokens = list(answer_norm)
    guess_tokens = list(guess_norm)

    # Exact or near-exact match
    if similarity(answer_norm, guess_norm) >= 0.88:
        return True

    # Last-name-only rule
    if len(answer_tokens) >= 2:
        last_name = normalize(answer).split(" ")[-1]
        last_name_tokens = list(last_name)
        if similarity(last_name_tokens, guess_norm) >= 0.88:
            return True

    # Full token overlap (order-insensitive)
    overlap = set(answer_tokens) & set(guess_tokens)
    if len(overlap) >= len(answer_tokens) - 1:
        return True

    return False

def normal_match(answer: str, guess: str) -> bool:
    if not answer or not guess:
        return False

    answer_norm = normalize(answer)
    guess_norm = normalize(guess)

    answer_tokens = set(list(answer_norm))
    guess_tokens = set(list(guess_norm))

    # Exact match
    if answer_norm == guess_norm:
        return True

    # Require most tokens to be present
    overlap = answer_tokens & guess_tokens
    token_coverage = len(overlap) / len(answer_tokens)

    if token_coverage < 0.75:
        return False

    # Guard against over-short guesses
    if len(guess_tokens) < len(answer_tokens) - 1:
        return False

    # Final fuzzy check (conservative)
    return similarity(answer_norm, guess_norm) >= 0.85

def answer_is_name(answer: str) -> bool:
    if not answer:
        return False

    # Get rid of "Accept:"s and "[]" stuff
    answer = strip_answerline_junk(answer)
    print("ANSWER", answer)

    # Reject if contains digits (except Roman numerals as last token)
    tokens = answer.split()
    print("TOKENS", tokens)
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
def player_join_lobby(email, lobbyAlias):
    session = get_session()
    try:
        lobby = session.execute(
            select(Lobbies)
            .where(Lobbies.name == lobbyAlias)
        ).scalars().first()

        player = session.execute(
            select(Players)
            .join(Users)
            .where(
                Users.email == email,
                Players.lobby_id == lobby.id
            )
            .options(
                joinedload(Players.user),
            )
        ).scalars().first()

        if not player:
            return {'message': 'player_join_lobby(): failure', 'error': f'User not found', "code": 400}

        setattr(player, "lobby_id", lobby.get("id"))

        session.commit()

        return {'message': 'player_join_lobby(): success', "code": 200}
    except Exception as e:
        session.rollback()
        return {'message': 'player_join_lobby(): failure', 'error': f'{e}', "code": 400}
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

        print("UPDATING GAME with new question", question.get("id"))


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
    bcrypt_regex = r"^\$2[abxy]?\$\d{2}\$[./A-Za-z0-9]{53}$"

    if bool(re.match(bcrypt_regex, password)):
        return password
    else:
        raise ValueError("Password is an invalide hash.")

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

def validate_and_convert_date(date_str):
    try:
        # Validate and parse the date string in MM/DD/YYYY format
        valid_date = datetime.strptime(date_str, '%m/%d/%Y').date()
        print(valid_date)
        return valid_date
    except ValueError:
        # If date parsing fails, raise an error
        raise ValueError("Date is of invalid format. Please use MM/DD/YYYY.")

def validate_phone_number(phone_number):
    if isinstance(phone_number, str):
        cleaned_string = re.sub(r"[()\-\s]", "", phone_number)
        # Regex for a general phone number format
        if len(cleaned_string) < 10:
            raise ValueError("Phone is of invalid format.")
        else:
            return cleaned_string
    else:
        raise ValueError("Phone is of invalid format. Must be of type str.")

# Maybe add an explicit filter to these in the future ;)
def validate_firstname(firstname):
    if len(firstname) > 15 or len(firstname) == 0:
        raise ValueError("Firstname must not exceed 15 characters.")
    else:
        return firstname
    
def validate_lastname(lastname):
    if len(lastname) > 25 or len(lastname) == 0:
        raise ValueError("Lastname must not exceed 25 characters.")
    else:
        return lastname

validation_list = {
    "email": validate_email,
    "password": validate_password_hash,
    "date": validate_and_convert_date,
    "birthday": validate_and_convert_date,
    "phone_number": validate_phone_number,
    "firstname": validate_firstname,
    "lastname": validate_lastname
}
