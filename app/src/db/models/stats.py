from sqlalchemy import Column, ForeignKey, Numeric, Integer, String, DateTime, Date, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash


class Stats(Base, CreatedAtColumn):
    __tablename__ = 'stats'
    __table_args__ = {'mysql_engine':'InnoDB'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(16), default=generate_unique_hash, unique=True, nullable=False)
    # In game points
    points = Column(Integer, default=0)
    correct = Column(Integer, default=0)
    power = Column(Integer, default=0)
    incorrect = Column(Integer, default=0)
    buzzes = Column(Integer, default=0)
    buzzes_encountered = Column(Integer, default=0)
    early = Column(Integer, default=0)
    bonuses = Column(Integer, default=0)
    questions_encountered = Column(Integer, default=0)

    rounds = Column(Integer, default=0)
    games = Column(Integer, default=0)
    average_time_to_buzz = Column(Numeric(5, 4), default=0.5000)

    player_id = Column(Integer, ForeignKey("players.id", ondelete="CASCADE"), nullable=False, unique=True)
    player = relationship("Players", back_populates="stats")

    def __repr__(self):
        return f"<Stats(id={self.id})>"
