import os
from flask_mail import Message
from src.extensions import mail

def send_test_email():

    msg = Message(
        subject="SendGrid Test",
        recipients=["ztlindquist17@gmail.com"],
        body="If you got this, SendGrid works."
    )

    mail.send(msg)