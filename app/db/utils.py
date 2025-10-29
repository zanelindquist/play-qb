# Import all of our models
from .models import *

import html
from datetime import datetime, timezone, timedelta
import re
import math
import random
from sqlalchemy import select, or_, and_, not_, delete, func, desc, literal, case
from sqlalchemy.orm import scoped_session, sessionmaker, joinedload, class_mapper, subqueryload
from sqlalchemy.inspection import inspect
from .data_structures import *

from app.db.db import engine

Session = scoped_session(sessionmaker(bind=engine))

def get_session():
    return Session

#========HELPER FUNCTIONS=======
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
        result = {field: getattr(obj, field) for field in fields if hasattr(obj, field)}
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


# RETRIEVING RESOURCES

def get_permissions_by_email_and_org(email, org_hash):
    try:
        session = get_session()
        user = get_user_by_email(email)

        employee = (
            session.query(Employees)
            .join(Orgs, Employees.org_id == Orgs.id)  # Properly join Employees to Orgs
            .filter(Employees.user_id == user.get("id"), Orgs.hash == org_hash)
            .options(joinedload(Employees.org))
            .first()
        )

        if employee is None or employee.kicked:
            return None
        
        permission_integer = employee.position.permission_level

        return get_permission_true_or_falses(permission_integer)
    except Exception as e:
        print(e)
    finally:
        session.remove()

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
                    joinedload(Users.employee_instances),
                    joinedload(Users.invites),
                    joinedload(Users.owned_orgs),
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

def get_random_question(level=2, difficulty=0, subject=0):
    session = get_session()
    try:
        count = math.floor(session.query(func.count(Questions.id)).scalar() * random.random())
        random_question_number = random.randint(0 , count - 1)
        print(random_question_number)
        question = session.execute(
            select(Questions)
            .where(Questions.id == random_question_number)
        ).scalars().first()

        print(question)

        return to_dict_safe(question, depth=0)

    except Exception as e:
        return {"code": 400, "error": str(e)}

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
