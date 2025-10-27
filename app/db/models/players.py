from sqlalchemy import Column, ForeignKey, Decimal, Integer, String, DateTime, Date, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash


class Players(Base, CreatedAtColumn):
    __tablename__ = 'players'
    __table_args__ = {'mysql_engine':'InnoDB'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(16), default=generate_unique_hash, unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=False)
    stats_id = Column(Integer, ForeignKey("Stats.id"), nullable=False)
    lobby_id = Column(Integer, ForeignKey("Lobbies.id"), nullable=False)
    current_game_id = Column(Integer, ForeignKey("Games.id"), nullable=False)
    name = Column(String)

    user = relationship("Users", back_populates="player_instances")
    stats = relationship("Stats", back_populates="player")
    lobbies = relationship("Lobbies", back_populates="players")
    current_game = relationship("Games", back_populates="players")

    def __repr__(self):
        return f"<Players(id={self.id}, user_id={self.user_id})>"
