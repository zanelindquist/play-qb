"""
    This file is for the lobby namespace of the sockets.
    It relates to finding a game, inviting friends, and party events
"""

from flask_socketio import emit, disconnect, join_room, leave_room
from flask import request, session
from flask_jwt_extended import decode_token

import time

from src.db.utils import *
from .constructor import socketio
from src.db.models.hash import generate_unique_hash


# ===== PARTIES =====

parties = {
    # "party_hash_1": {
    #     "leader_id": hash,
    #     "members": {hash: ready?},
    #     "lobby_id": None
    # }
}

def create_party(user_hash: str) -> str:
    # Make sure user isn't already in a party
    has_party = get_party_by_user(user_hash)
    if has_party:
        return has_party

    party_hash = generate_unique_hash()

    parties[party_hash] = {
        "leader_hash": user_hash,
        "members": {user_hash: False},
        "lobby_alias": "solos" # Default gamemode 
    }

    return party_hash

def get_party_by_user(user_hash: str) -> str:
    for party_hash, party in parties.items():
        if user_hash in list(party["members"].keys()):
            return party_hash
        
def get_party_member_info(party_hash: str) -> list:
    party_members = [get_user_by_hash(hash) for hash in list(parties[party_hash].get("members").keys())]
    # Set who is ready or not
    for member in party_members:
        member["is_leader"] = parties[party_hash].get("leader_hash") == member.get("hash")
        member["ready"] = parties[party_hash].get("members")[member.get("hash")]

    return party_members

def is_in_party(user_hash: str, party_hash: str) -> bool:
    if user_hash in list(parties[party_hash]["members"].keys()):
        return True
    else:
        return False
        
# Reaturns a boolean of if everyone is ready
def set_party_member_ready(user_hash: str, party_hash: str, is_ready: bool) -> bool:
    parties[party_hash]["members"][user_hash] = is_ready

    for value in list(parties[party_hash]["members"].values()):
        if not value:
            return False
        
    # Now that everyone is ready, we will set them to not ready for the next time they enter the pre lobby party
    for key in list(parties[party_hash]["members"].keys()):
        parties[party_hash]["members"][key] = False
        
    return True

def set_party_lobby_alias(party_hash: str, lobby_alias: str) -> None:
    parties[party_hash]["lobby_alias"] = lobby_alias

def join_party(user_hash: str, party_hash: str) -> tuple:
    if not parties.get(party_hash):
        raise Exception("join_party(): party does not exist")
    parties[party_hash]["members"][user_hash] = False

    return (party_hash, parties[party_hash])
        
def leave_party(user_hash: str) -> None:
    for party_id, party in list(parties.items()):
        # Remove user hashs
        if user_hash in list(party["members"].keys()):
            del party["members"][user_hash]

        # Delete party if its empty
        if not party["members"]:
            del parties[party_id]
            return

        # Set new leader
        if party["leader_hash"] == user_hash:
            party["leader_hash"] = next(iter(list(party["members"].keys())))

def get_timestamp():
    return int(time.time() * 1000)

# ===== INCOMMING EVENT HANDLERS =====

@socketio.on("connect", "/lobby")
def on_connect(auth):
    token = auth.get("token")

    if not token:
        print("No token provided")
        emit("failed_connection", {"message": "No token provided", "code": 400})
        disconnect()
        return
    
    try:
        decoded = decode_token(token)
        identity = decoded.get("sub")
    except Exception as e:
        print("Invalid token")
        emit("failed_connection", {"message": "Invalid token", "code": 401})
        return
    
    # Set the user_id
    request.environ["user_id"] = identity;

    # Set the lobby alias for now
    request.environ["prelobby"] = "solos"

    user = get_user_by_email(identity)

    join_room(f"user:{user.get("hash")}")

    # Set the party to just the user right now
    party_hash = create_party(user.get("hash"))
    join_room(f"party:{party_hash}")
    request.environ["party"] = party_hash

    print(f"Socket connected to /lobby: user={identity}")

@socketio.on("disconnect", "/lobby")
def on_disconnect():
    user_id = request.environ.get("user_id")
    lobby = request.environ.get("lobby")
    party_hash = request.environ.get("party")

    print(f"Received disconnect from /lobby: user={user_id}")

    set_user_online(user_id, False)

    user = get_user_by_email(user_id)

    leave_party(user.get("hash"))

    emit("user_disconnected", {"user_hash": user.get("hash")}, room=f"party:{party_hash}")

# This is where we get information about a lobby
@socketio.on("enter_lobby", "/lobby")
def on_enter_lobby(data):
    user_id = request.environ["user_id"]
    party_hash = request.environ["party"]

    user = get_user_by_email(user_id)

    if not party_hash:
        # Set the party to just the user right now
        party_hash = create_party(user.get("hash"))
        join_room(f"party:{party_hash}")
        request.environ["party"] = party_hash

    # Put the user in the pre-lobby room
    lobby = data.get("lobbyAlias")
    request.environ["prelobby"] = lobby
    join_room(f"prelobby:{lobby}")

    if not lobby:
        emit("prelobby_not_found", {"message": "Cannot find target lobby", "code": 404})
        return;

    # Get the number of current players in the lobby
    lobby_data = get_lobby_by_alias(lobby)

    if not lobby_data:
        emit("prelobby_not_found", {"message": "Cannot find target lobby", "code": 404})
        return;

    # Tell this player's friends what gamemode they are now in

    # Give the player their information (load profiles, ect)
    player = get_player_by_email_and_lobby(user_id, lobby)
    party_members = get_party_member_info(party_hash)

    set_user_online(user_id, True)

    emit("prelobby_joined", {"player": player, "user": user, "party_members": party_members, "lobby": lobby_data})

# Partying

@socketio.on("search_friends", "/lobby")
def on_search_friends(data):
    user_id = request.environ["user_id"]
    lobby = request.environ["prelobby"]
    party_hash = request.environ["party"]

    query = data.get("query")

    friends = get_friends_by_email(user_id, online=True, party=parties[party_hash])

    # Apply the query
    friends = search_filter(friends, ["firstname", "lastname"], query)

    emit("friends_found", {"friends": friends})

@socketio.on("invite_friend", "/lobby")
def on_invite_friend(data):
    user_id = request.environ["user_id"]
    lobby = request.environ["prelobby"]
    party_hash = request.environ["party"]

    invited_hash = data.get("hash")

    if not invited_hash:
        emit("invite_friend", {"message": "add_friend(): hash not provided", "code": 400})
        return
    
    # See if the user is already in the party
    if is_in_party(invited_hash, party_hash):
        emit("invite_friend", {"message": "add_friend(): friend already in party", "code": 409})
        return
    
    inviter = get_user_by_email(user_id)

    emit("invited", {"from_user": inviter, "party_hash": party_hash}, room=f"user:{invited_hash}")

@socketio.on("accepted_invite", "/lobby")
def on_accepted_invite(data):
    user_id = request.environ["user_id"]
    lobby = request.environ["prelobby"]

    new_party_hash = data.get("party_hash")
    if not new_party_hash:
        emit("accepted_invite", {"message": "accepted_invite(): party_hash not provided", "code": 400})
        return

    user = get_user_by_email(user_id)
    user_hash = user.get("hash")

    old_party_hash = request.environ.get("party")

    # Leave old party/room first if different
    if old_party_hash and old_party_hash != new_party_hash:
        try:
            leave_room(f"party:{old_party_hash}")
        except Exception:
            pass
        leave_party(user_hash)

    # Join new party
    try:
        party_hash, party = join_party(user_hash, new_party_hash)
    except Exception as e:
        emit("accepted_invite", {"message": str(e), "code": 400})
        return

    join_room(f"party:{party_hash}")
    request.environ["party"] = party_hash

    # Get party members to send back to update UI (include ready state)
    party_members = get_party_member_info(party_hash)

    # Get the lobby info for the new party member
    lobby_data = get_lobby_by_alias(party.get("lobby_alias"))

    emit("joined_party", {"members": party_members, "user": user, "lobby": lobby_data}, room=f"party:{party_hash}")

@socketio.on("leave_party", "/lobby")
def on_leave_party(data):
    user_id = request.environ["user_id"]
    lobby = request.environ["prelobby"]
    party_hash = request.environ["party"]

    user = get_user_by_email(user_id)
    user_hash = user.get("hash")

    # Leave old party
    leave_party(user_hash)
    leave_room(f"party:{party_hash}")

    # Join new personal party
    new_party_hash = create_party(user.get("hash"))
    new_party = parties[new_party_hash]
    join_room(f"party:{new_party_hash}")
    request.environ["party"] = new_party_hash

    # Get party members to send back to update UI (include ready state)
    new_party_members = get_party_member_info(new_party_hash)
    old_party_members = get_party_member_info(party_hash)

    lobby_data = get_lobby_by_alias(lobby)

    # For new party
    emit("member_left_party", {"user": user, "members": new_party_members, "lobby": lobby_data}, room=f"party:{new_party_hash}")

    # For old party
    emit("member_left_party", {"user": user, "members": old_party_members}, room=f"party:{party_hash}")



# Entering the game
@socketio.on("party_member_ready", "/lobby")
def on_party_member_ready(data):
    user_id = request.environ["user_id"]
    lobby = request.environ["prelobby"]
    party_hash = request.environ["party"]

    user = get_user_by_email(user_id)

    is_ready = data.get("ready")

    everyone_ready = set_party_member_ready(user.get("hash"), party_hash, is_ready)

    emit("party_member_readied", {"ready_info": parties[party_hash]["members"]}, room=f"party:{party_hash}")

    if everyone_ready:
        emit("all_ready", room=f"party:{party_hash}")

@socketio.on("clients_ready", "/lobby")
def on_party_member_ready(data):
    user_id = request.environ["user_id"]
    lobby = request.environ["prelobby"]
    party_hash = request.environ["party"]

    user = get_user_by_email(user_id)

    party_hash = get_party_by_user(user.get("hash"))
    party = parties[party_hash]

    if user.get("hash") != party["leader_hash"]:
        return;

    # See if this is a custom and we need to create a new lobby
    settings = data.get("settings")

    if not settings:
        emit("enter_lobby", {"lobby_alias": party["lobby_alias"]}, room=f"party:{party_hash}")
        return
    
    # Create a lobby based on the settings
    result = create_lobby(settings)

    if result.get("code") >= 400:
        # If the lobby exists, tell them that
        if result.get("code") == 403:
            emit("failed_lobby_creation", {"message": "Lobby with that alias already exists"}, room=f"party:{party_hash}")
            return
        emit("failed_lobby_creation", result, room=f"party:{party_hash}")
        return;

    emit("enter_lobby", {"lobby_alias": result.get("lobby").get("name")}, room=f"party:{party_hash}")


@socketio.on("change_gamemode", "/lobby")
def on_changed_gamemode(data):
    user_id = request.environ["user_id"]
    lobby = request.environ["prelobby"]
    party_hash = request.environ["party"]

    user = get_user_by_email(user_id)

    # Make sure the user is the party leader

    if user.get("hash") != parties[party_hash]["leader_hash"]:
        return;

    # Get lobby info
    new_lobby_alias = data.get("lobby_alias")

    lobby_data = get_lobby_by_alias(new_lobby_alias)

    if new_lobby_alias == "custom":
        lobby_data["name"] = generate_random_lobby_name()

    set_party_lobby_alias(party_hash, new_lobby_alias)

    emit("changed_gamemode", {"lobby": lobby_data}, room=f"party:{party_hash}")

@socketio.on("custom_settings_changed", "/lobby")
def on_custom_settings_changed(data):
    user_id = request.environ["user_id"]
    lobby = request.environ["prelobby"]
    party_hash = request.environ["party"]

    user = get_user_by_email(user_id)

    # Make sure the user is the party leader
    if user.get("hash") != parties[party_hash]["leader_hash"]:
        return;

    # Simply just tell the other party members what the leader changed
    emit("changed_custom_settings", {"settings": data.get("settings")}, room=f"party:{party_hash}")


# Adding friends

@socketio.on("search_users", "/lobby")
def on_search_users(data):
    user_id = request.environ["user_id"]
    lobby = request.environ["prelobby"]

    query = data.get("query")
    if not query:
        emit("users_found", {"users": []})
        return

    users = get_users_by_query(query)

    emit("users_found", {"users": users})

@socketio.on("add_friend", "/lobby")
def on_add_friend(data):
    user_id = request.environ["user_id"]
    lobby = request.environ["prelobby"]

    hash = data.get("hash")

    if not hash:
        emit("added_friend", {"message": "add_friend(): hash not provided", "code": 400})
        return

    result = create_friend_request_from_email_to_hash(user_id, hash)

    emit("added_friend", result)


# Finding lobbies

@socketio.on("search_lobbies", "/lobby")
def on_search_users(data):
    user_id = request.environ["user_id"]
    lobby = request.environ["prelobby"]

    query = data.get("query")
    if not query:
        emit("lobbies_found", {"users": []})
        return

    lobbies = get_lobbies_by_query(query)

    emit("lobbies_found", {"lobbies": lobbies})


