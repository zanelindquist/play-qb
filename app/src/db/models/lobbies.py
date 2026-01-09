from sqlalchemy import Column, Table, ForeignKey, Integer, String, DateTime, Date, Boolean, select, func
from sqlalchemy.types import JSON
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash
from .players import Players

class Lobbies(Base, CreatedAtColumn):
    __tablename__ = 'lobbies'
    __table_args__ = {'mysql_engine':'InnoDB'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(16), default=generate_unique_hash, unique=True, nullable=False)
    name = Column(String(40), default="playqb")
    total_games = Column(Integer, default=0)
    level = Column(Integer, default=0)
    category = Column(Integer, default=0)
    speed = Column(Integer, default=400)
    gamemode = Column(String(10), default="solos", nullable=False)
    rounds = Column(Integer, default=20)
    bonuses = Column(Boolean, default=False)
    allow_multiple_buzz = Column(Boolean, default=True)
    allow_question_skip = Column(Boolean, default=True)
    allow_question_pause = Column(Boolean, default=True)

    games = relationship("Games", back_populates="lobby")
    players = relationship("Players", back_populates="lobby")

    @hybrid_property
    def number_of_online_players(self):
        return sum(1 for p in self.players if p.is_online)

    @number_of_online_players.expression
    def number_of_online_players(cls):
        return (
            select(func.count(Players.id))
            .where(
                Players.lobby_id == cls.id,
                Players.is_online.is_(True)
            )
            .scalar_subquery()
        )

    def __repr__(self):
        return f"<Lobby(id={self.id} name={self.name})>"
