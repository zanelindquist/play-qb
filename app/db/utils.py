# Import all of our models
from .models import Users, Players, Games, Lobbies, Stats

import html
from datetime import datetime, timezone, timedelta
import re

from sqlalchemy import select, or_, and_, not_, delete, func, desc, literal, case
from sqlalchemy.orm import scoped_session, sessionmaker, joinedload, class_mapper, subqueryload
from sqlalchemy.inspection import inspect

from app.db.db import engine

Session = scoped_session(sessionmaker(bind=engine))

def get_session():
    return Session


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


# ======SANITATION AND VALIDATION=======

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
