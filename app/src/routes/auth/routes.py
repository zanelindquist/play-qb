# This file is for all of the authentication routes

from flask import Flask, request, jsonify, Blueprint, current_app, make_response
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity
)
from flask_bcrypt import Bcrypt

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests

bcrypt = Bcrypt()

from ...db.utils import *

bp = Blueprint('auth', __name__, url_prefix='/auth')

# TODO: Put this in an environment variable or something. Do the same for the front end one.
from .secrets import *

@bp.route("/test", methods=["POST"])
def test():
    print("TESTTTT")
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
    code = request.json.get("code")
    redirect_uri = request.json.get("redirect_uri")

    if not code:
        return jsonify({"error": "No authorization code provided"}), 400
    
    if not redirect_uri:
        return jsonify({"error": "No redirect URI provided"}), 400

    try:
        # Exchange authorization code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,  # This stays secure on backend
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code"
        }
        
        token_response = requests.post(token_url, data=token_data)
        token_response.raise_for_status()
        tokens = token_response.json()
        
        # Verify the ID token
        id_token_str = tokens.get("id_token")
        if not id_token_str:
            return jsonify({"error": "No ID token in response"}), 400
            
        info = id_token.verify_oauth2_token(
            id_token_str, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10
        )

        data = {
            "email": info["email"],
            "name": info["name"],
            "google_id": info["sub"]
        }

        email = data.get("email")
        user = get_user_by_email(email, gentle=False)

        if user is None:
            return jsonify({"error": "Email does not exist"}), 400

        # If the user exists here, we log them in
        access_token = create_access_token(identity=str(email))
        
        # Optionally store refresh_token for later use
        # refresh_token = tokens.get("refresh_token")
        
        return jsonify({"access_token": access_token}), 200
        
    except Exception as e:
        print(f"Error during Google OAuth: {str(e)}")
        return jsonify({"error": "Failed to authenticate with Google"}), 400
    
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
    code = request.json.get("code")
    redirect_uri = request.json.get("redirect_uri")

    if not code:
        return jsonify({"error": "No authorization code provided"}), 400
    
    if not redirect_uri:
        return jsonify({"error": "No redirect URI provided"}), 400

    try:
        # Exchange authorization code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,  # This stays secure on backend
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code"
        }
        
        token_response = requests.post(token_url, data=token_data)
        token_response.raise_for_status()
        tokens = token_response.json()
        
        # Verify the ID token
        id_token_str = tokens.get("id_token")
        if not id_token_str:
            return jsonify({"error": "No ID token in response"}), 400
            
        info = id_token.verify_oauth2_token(
            id_token_str, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10
        )

        data = {
            "email": info["email"],
            "name": info["name"],
            "google_id": info["sub"]
        }

        email = data.get("email")
        user = get_user_by_email(email, gentle=False)

        if user is not None:
            # If the user exists, just log them in, but tell them the user exists
            access_token = create_access_token(identity=str(email))
            return jsonify({"access_token": access_token, "message": "User already exists"}), 200
        
        result = create_user({
            "email": email,
            "password": None, # NO PASSWORD BECAUSE WE ARE USING GOOGLE
            "username": data.get("name")
        })

        code = result["code"]
        del result["code"]

        if result.get("error"):
            return jsonify(result), code

        # Now that the user is created, log them in, we log them in
        access_token = create_access_token(identity=str(email))
        
        # Optionally store refresh_token for later use
        # refresh_token = tokens.get("refresh_token")
        
        return jsonify({"access_token": access_token, "email": email, "name": data.get("name")}), 200
        
    except Exception as e:
        print(f"Error during Google OAuth: {str(e)}")
        return jsonify({"error": "Failed to authenticate with Google"}), 400

@bp.route("/google_set_username", methods=["POST"])
@jwt_required()
def google_set_username():
    username = request.json.get("username")
    email = get_jwt_identity()

    result = edit_user(email, {"username": username})

    if result.get("code") >= 400:
        return jsonify(result), result.get("code")
    
    return jsonify(), 200


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
