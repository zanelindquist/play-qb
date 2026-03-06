from sqlalchemy import Column, Index, Table, Text, ForeignKey, Integer, Float, String, DateTime, Date, Boolean
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash

class Questions(Base, CreatedAtColumn):
    __tablename__ = 'questions'
    __table_args__ = (
        Index("idx_question_lookup", "type", "difficulty", "category", "tournament"),
        {'mysql_engine':'InnoDB'}
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(16), default=generate_unique_hash, unique=True, nullable=False)
    scraped_hex = Column(String(24), unique=True)
    tournament = Column(String(50), default="Untitled Tournament", nullable=False)
    type = Column(Integer, default=0) # 0 for tossup, 1 for bonus
    year = Column(String(9))
    level = Column(Integer, default=2) # Depricated, use difficulty now
    difficulty = Column(Integer, default=0)
    category = Column(String(20), default="Unknown")
    subcategory = Column(String(30))
    question = Column(Text, nullable=False)
    answers = Column(Text, nullable=False)
    category_confidence = Column(Float, nullable=True, default=0.5)
    hand_labeled = Column(Boolean, default=False)

    # Ranked information
    difficulty_mu = Column(Float, default=1500, nullable=False)
    difficulty_sigma = Column(Float, default=400, nullable=False)
    times_asked = Column(Integer, default=0)

    reports = relationship("Reports", back_populates="question")
    games = relationship("Games", back_populates="current_question")

    def __repr__(self):
        return f"<Question(id={self.id}, tournament={self.tournament})>"
