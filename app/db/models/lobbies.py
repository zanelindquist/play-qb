from sqlalchemy import Column, Table, ForeignKey, Decimal, Integer, String, DateTime, Date, Boolean
from sqlalcheym.types import JSON, Set
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash

class Lobby(Base, CreatedAtColumn):
    __tablename__ = 'lobby'
    __table_args__ = {'mysql_engine':'InnoDB'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(16), default=generate_unique_hash, unique=True, nullable=False)
    name = Column(String, default="Play Quiz Bowl")
    lobby_id = Column(Integer, ForeignKey("Lobbies.id"), nullable=False)
    question_number = Column(Integer, default=0)
    game_mode = Column(Integer, default=1)
    rounds = Column(JSON, default=[])
    player_ids = Column(JSON, default=[])
    teams = Column(JSON, default=[])
    level = Column(Integer, default=0)
    category = Column(Integer, default=0)
    speed = Column(Integer, default=150)

    games = relationship("Games", back_populates="games")

    def __repr__(self):
        return f"<Game(id={self.id}, lobby_id={self.lobby_id})>"
