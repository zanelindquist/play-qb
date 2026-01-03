from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, Date, Boolean, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash


class Players(Base, CreatedAtColumn):
    __tablename__ = 'players'
    __table_args__ = {'mysql_engine':'InnoDB'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(16), default=generate_unique_hash, unique=True, nullable=False)
    name = Column(String(16), default="Player")
    is_online = Column(Boolean, default=False)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("Users", back_populates="player_instances")
        
    lobby_id = Column(Integer, ForeignKey("lobbies.id"), nullable=False)
    lobby = relationship("Lobbies", back_populates="players")
    
    current_game_id = Column(Integer, ForeignKey("games.id"), nullable=True)
    current_game = relationship("Games", back_populates="players")
    
    stats = relationship(
        "Stats",
        back_populates="player",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<Players(id={self.id}, user_id={self.user_id}, lobby_id={self.lobby_id})>"
