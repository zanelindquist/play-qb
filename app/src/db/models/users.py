from sqlalchemy import Column, Integer, String, DateTime, Date, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash

class Users(Base, CreatedAtColumn):
    __tablename__ = 'users'
    __table_args__ = {'mysql_engine':'InnoDB'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(16), default=generate_unique_hash, unique=True, nullable=False)
    email = Column(String(50), nullable=False, unique=True)
    password = Column(String(60), nullable=True)
    firstname = Column(String(15), nullable=False)
    lastname = Column(String(25), nullable=False)
    phone_number = Column(String(14), nullable=False)
    birthday = Column(Date, nullable=False)
    account_disabled = Column(Boolean, nullable=False, default=False)
    email_verified = Column(Boolean, nullable=False, default=False)
    is_online = Column(Boolean, default=False)

    player_instances = relationship("Players", back_populates="user")

    sent_requests = relationship("Friends", back_populates="sender", foreign_keys="Friends.sender_id")
    received_requests = relationship("Friends", back_populates="receiver", foreign_keys="Friends.receiver_id")

    created_lobbies = relationship("Lobbies", back_populates="creator")

    @property
    def friends(self):
        """Return accepted friends as a list of Users"""
        accepted = []
        for fr in self.sent_requests + self.received_requests:
            if fr.is_accepted:
                accepted.append(fr.receiver if fr.sender_id == self.id else fr.sender)
        return accepted

    def __repr__(self):
        return f"<User(id={self.id}, name={self.lastname}, {self.firstname}, email={self.email})>"
