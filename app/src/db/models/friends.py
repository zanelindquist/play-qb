from sqlalchemy import Column, ForeignKey, Table, Integer, String, DateTime, Date, Boolean
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash

class Friends(Base, CreatedAtColumn):
    __tablename__ = "friends"
    __table_args__ = {'mysql_engine':'InnoDB'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(16), default=generate_unique_hash, unique=True, nullable=False)
    is_accepted = Column(Boolean, default=False, nullable=False)

    sender_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    sender = relationship("Users", foreign_keys=[sender_id], back_populates="sent_requests")
    
    receiver_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    receiver = relationship("Users", foreign_keys=[receiver_id], back_populates="received_requests")