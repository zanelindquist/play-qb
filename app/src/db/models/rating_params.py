from sqlalchemy import Column, ForeignKey, Numeric, Float, Integer, String, DateTime, Date, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash


class RatingParams(Base, CreatedAtColumn):
    __tablename__ = 'rating_params'
    __table_args__ = {'mysql_engine':'InnoDB'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(20), nullable=False, unique=True)
    value = Column(Float)
    description = Column(String(100))

    def __repr__(self):
        return f"<RatingParams(id={self.id})>"
