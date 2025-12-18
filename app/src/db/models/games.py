from sqlalchemy import Column, ForeignKey, Table, Integer, String, DateTime, Date, Boolean
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash

class Games(Base, CreatedAtColumn):
    __tablename__ = 'games'
    __table_args__ = {'mysql_engine':'InnoDB'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(16), default=generate_unique_hash, unique=True, nullable=False)
    active = Column(Boolean, default=True)
    question_number = Column(Integer, default=0)
    game_mode = Column(Integer, default=1)
    rounds = Column(JSON, default=[])
    teams = Column(JSON, default=[])
    level = Column(Integer, default=0)
    category = Column(Integer, default=0)
    speed = Column(Integer, default=150)

    lobby_id = Column(Integer, ForeignKey("lobbies.id"), nullable=False)
    lobby = relationship("Lobbies", back_populates="games")
    
    players = relationship("Players", back_populates="current_game")

    def __repr__(self):
        return f"<Game(id={self.id}, lobby_id={self.lobby_id})>"
