from sqlalchemy import Column, ForeignKey, Numeric, Integer, String, DateTime, Date, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash


class SavedQuestions(Base, CreatedAtColumn):
    __tablename__ = 'saved_questions'
    __table_args__ = {'mysql_engine':'InnoDB'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(16), default=generate_unique_hash, unique=True, nullable=False)
    saved_type = Column(String(10), default="missed", nullable=False) # all, missed, correct, saved

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user = relationship("Users")

    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    question = relationship("Questions")

    def __repr__(self):
        return f"<SavedQuestions(id={self.id})>"
