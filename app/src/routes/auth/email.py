import random
from datetime import datetime, timezone, timedelta

from flask_mail import Message
from sqlalchemy import select, or_, and_, not_, delete, func, desc, literal, case, exists, update

from src.extensions import mail
from src.db import db
from src.db.utils import get_email_verification_by_user_id, get_session
from src.db.models import EmailVerifications

def generate_code():
    return str(random.randint(100000, 999999))


def send_verification_email(user) -> int:
    """
    Create verification code, store it in DB, and email it to the user.
    """

    # Generate code
    code = generate_code()

    print("CODE", code)
    print("USER", user)

    session = get_session()

    verification = session.execute(
        select(EmailVerifications)
        .where(EmailVerifications.user_id == user.get("id"))
    ).scalars().first()

    # If a valid (non-expired) code already exists → skip sending
    if verification and verification.expires_at > datetime.now(timezone.utc).replace(tzinfo=None):
        return 400


    if verification:
        setattr(verification, "code", code)
        setattr(verification, "expires_at", datetime.now(timezone.utc) + timedelta(minutes=10))
    else:
        verification = EmailVerifications(
            user_id=user.get("id"),
            code=code,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
        )
        session.add(verification)

    session.commit()

    # Create email
    msg = Message(
        subject="Verify your MoreQuizBowl account",
        recipients=[user.get("email")],
    )

    msg.body = f"""
    Welcome to MoreQuizBowl!

    Your verification code is:

    {code}

    This code expires in 10 minutes.

    If you did not create this account, you can safely ignore this email.
    """

    msg.html = f"""
    <h2>Welcome to MoreQuizBowl</h2>

    <p>Your verification code is:</p>

    <h1 style="letter-spacing:4px;">{code}</h1>

    <p>This code expires in <b>10 minutes</b>.</p>

    <p>If you didn't create this account, you can ignore this email.</p>
    """

    mail.send(msg)

    return 200