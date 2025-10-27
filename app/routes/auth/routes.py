# This file is for all of the authentication routes

from flask import Flask, request, jsonify, Blueprint, current_app, make_response
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity
)
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

from ...db.utils import create_user, validate_email, validate_password, get_user_by_email, get_permissions_by_email_and_org

bp = Blueprint('auth', __name__, url_prefix='/auth')

@bp.route("/login", methods=["POST"])
def login():
    email = request.json.get("email")
    password = request.json.get("password")

    user = get_user_by_email(email, gentle=False)

    print(user)

    if user is None:
        return jsonify({"error": "Email does not exist"}), 400

    if bcrypt.check_password_hash(user.get("password"), password):
        # Generate an access token to send to the user
        access_token = create_access_token(identity=str(email))
        return jsonify({"access_token": access_token}), 200
    else:
        return jsonify({"error": "Password is incorrect"}), 401

    # We need to find the password associated with the email
    

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

@bp.route("/permissions", methods=["POST"])
@jwt_required()
def permissions():
    data = request.get_json()
    org = data.get("org")

    if not org:
        return jsonify({"error": "Organization hash is not specified"}), 404
    
    permissions = get_permissions_by_email_and_org(get_jwt_identity(), org)

    if not permissions:
        return jsonify({"error": "Permissions not found"}), 404
    
    return jsonify({"current_employee_permissions": permissions})