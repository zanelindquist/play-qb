from sqlalchemy import Column, ForeignKey, Numeric, Float, Integer, String, DateTime, Date, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash


class UserCategorySkill(Base, CreatedAtColumn):
    __tablename__ = 'user_category_skill'
    __table_args__ = {'mysql_engine':'InnoDB'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(16), default=generate_unique_hash, unique=True, nullable=False)
    category_code = Column(Integer, nullable=False)
    mu = Column(Float, default=1500, nullable=False)
    sigma = Column(Float, default=350, nullable=False)
    questions_seen = Column(Integer, default=0)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    def __repr__(self):
        return f"<UserCategorySkill(id={self.id})>"
