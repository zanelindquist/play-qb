# This file is for all of the authentication routes

from flask import Flask, request, jsonify, Blueprint, current_app, make_response
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity
)
from flask_bcrypt import Bcrypt

from google.oauth2 import id_token
from google.auth.transport import requests

bcrypt = Bcrypt()

from ...db.utils import create_user, validate_email, validate_password, get_user_by_email

bp = Blueprint('auth', __name__, url_prefix='/auth')

# TODO: Put this in an environment variable or something. Do the same for the front end one.
GOOGLE_CLIENT_ID = "808125844318-mauiibkqggqmpgisg2von6cvtulhkkmh.apps.googleusercontent.com"

@bp.route("/test", methods=["POST"])
def test():
    package = request.json.get("package")

    return {"package": package}, 200


@bp.route("/login", methods=["POST"])
def login():
    email = request.json.get("email")
    password = request.json.get("password")

    user = get_user_by_email(email, gentle=False)

    if user is None:
        return jsonify({"error": "Email does not exist"}), 400

    if bcrypt.check_password_hash(user.get("password"), password):
        # Generate an access token to send to the user
        access_token = create_access_token(identity=str(email))
        return jsonify({"access_token": access_token}), 200
    else:
        return jsonify({"error": "Password is incorrect"}), 401

    # We need to find the password associated with the email
    
@bp.route("/google_auth_login", methods=["POST"])
def google_auth_login():
    token = request.json.get("token")

    # Verify google token
    info = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
    data = {
        "email": info["email"],
        "name": info["name"],
        "google_id": info["sub"]
    }

    print(data)

    email = data.get("email")

    user = get_user_by_email(email, gentle=False)

    if user is None:
        return jsonify({"error": "Email does not exist"}), 400

    # If the user exists here, we log them in

    access_token = create_access_token(identity=str(email))
    return jsonify({"access_token": access_token}), 200

@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    # The front end should validate our password, but its just good to do it twice bc Im using postman
    try:
        validate_password(password=password)
    except ValueError as e:
        return jsonify({"error": f"{e}"}), 400

    # Hash and salt password here using bcrypt
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    print(hashed_password)

    data["password"] = hashed_password

    result = create_user(data)

    code = result["code"]
    del result["code"]

    if(result.get("error")):
        return jsonify(result), code
    
    result["access_token"] = create_access_token(identity=str(email))

    # Process the data or respond
    return jsonify(result), code

@bp.route("/google_auth_register", methods=["POST"])
def google_auth_register():
    token = request.json.get("token")

    # Verify google token
    info = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
    data = {
        "email": info["email"],
        "name": info["name"],
        "google_id": info["sub"]
    }

    print(data)

    email = data.get("email")

    # NO PASSWORD BECAUSE WE ARE USING GOOGLE
    data["password"] = ""

    # Create the user using the data we received
    result = create_user(data)

    code = result["code"]
    del result["code"]

    if result.get("error"):
        return jsonify(result), code
    
    result["access_token"] = create_access_token(identity=str(email))

    # Process the data or respond
    return jsonify(result), code


@bp.route("/email", methods=["POST"])
def email():
    data = request.get_json()
    email = data.get("email")

    try:
        validate_email(email)

        # If we have made it here, the check did not raise any emails and the email is good
        return jsonify({"email": email}), 200
    except ValueError as e:
        return jsonify({"error": f"{e}"}), 400
