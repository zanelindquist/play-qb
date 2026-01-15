from sqlalchemy import Column, Table, Text, ForeignKey, Integer, Float, String, DateTime, Date, Boolean
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash

class Questions(Base, CreatedAtColumn):
    __tablename__ = 'questions'
    __table_args__ = {'mysql_engine':'InnoDB'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(16), default=generate_unique_hash, unique=True, nullable=False)
    tournament = Column(String(50), default="Untitled Tournament", nullable=False)
    type = Column(Integer, default=0)
    year = Column(String(9))
    level = Column(Integer, default=2)
    difficulty = Column(Integer, default=0)
    category = Column(String(20), default="Unknown")
    question = Column(Text, nullable=False)
    answers = Column(Text, nullable=False)
    prompts = Column(Text)
    category_confidence = Column(Float, nullable=False, default=0.5)
    hand_labeled = Column(Boolean, default=False)

    reports = relationship("Reports", back_populates="question")
    games = relationship("Games", back_populates="current_question")

    def __repr__(self):
        return f"<Question(id={self.id}, tournament={self.tournament})>"
