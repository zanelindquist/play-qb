from sqlalchemy import Column, Table, ForeignKey, Integer, String, DateTime, Date, Boolean
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash

class Reports(Base, CreatedAtColumn):
    __tablename__ = 'reports'
    __table_args__ = {'mysql_engine':'InnoDB'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(16), default=generate_unique_hash, unique=True, nullable=False)
    reason_code = Column(Integer, default=0)
    flagged_category = Column(String(20))
    description = Column(String(150), default="No description.")

    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    question = relationship("Questions", back_populates="reports")

    def __repr__(self):
        return f"<Report(id={self.id}, question_id={self.question_id})>"
