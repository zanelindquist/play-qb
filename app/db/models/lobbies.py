from sqlalchemy import Column, Table, ForeignKey, Integer, String, DateTime, Date, Boolean
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash

class Lobbies(Base, CreatedAtColumn):
    __tablename__ = 'lobbies'
    __table_args__ = {'mysql_engine':'InnoDB'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(16), default=generate_unique_hash, unique=True, nullable=False)
    name = Column(String(16), default="Play Quiz Bowl")
    total_games = Column(Integer, default=0)


    games = relationship("Games", back_populates="games")
    players = relationship("Players", back_populates="lobby")

    def __repr__(self):
        return f"<Lobby(id={self.id}, lobby_id={self.lobby_id})>"
