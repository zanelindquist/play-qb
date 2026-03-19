from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, Date, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash

import src.db.ranked as ranked

class Users(Base, CreatedAtColumn):
    __tablename__ = 'users'
    __table_args__ = {'mysql_engine':'InnoDB'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(16), default=generate_unique_hash, unique=True, nullable=False)
    email = Column(String(50), nullable=False, unique=True)
    password = Column(String(60), nullable=True)
    username = Column(String(20), nullable=False, unique=True)
    phone_number = Column(String(14), nullable=True)
    birthday = Column(Date, nullable=True)
    account_disabled = Column(Boolean, nullable=False, default=False)
    email_verified = Column(Boolean, nullable=False, default=False)
    is_online = Column(Boolean, default=False)
    premium = Column(Boolean, default=False)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)

    current_lobby_id = Column(Integer, ForeignKey("lobbies.id"), nullable=True)
    current_lobby = relationship(
        "Lobbies",
        back_populates="users",
        foreign_keys=[current_lobby_id]
    )

    current_game_id = Column(Integer, ForeignKey("games.id"), nullable=True)
    current_game = relationship("Games", back_populates="users")

    sent_requests = relationship("Friends", back_populates="sender", foreign_keys="Friends.sender_id")
    received_requests = relationship("Friends", back_populates="receiver", foreign_keys="Friends.receiver_id")

    stats = relationship(
        "Stats",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False
    )

    created_lobbies = relationship(
        "Lobbies",
        back_populates="creator",
        foreign_keys="Lobbies.creator_id"
    )

    email_verification = relationship(
        "Email_Verifications",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    @property
    def friends(self):
        """Return accepted friends as a list of Users"""
        accepted = []
        for fr in self.sent_requests + self.received_requests:
            if fr.is_accepted:
                accepted.append(fr.receiver if fr.sender_id == self.id else fr.sender)
        return accepted

    def __repr__(self):
        return f"<User(id={self.id}, name={self.username}, email={self.email})>"
