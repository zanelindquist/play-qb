from sqlalchemy import Column, Integer, String, DateTime, Date, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash

class Users(Base, CreatedAtColumn):
    __tablename__ = 'users'
    __table_args__ = {'mysql_engine':'InnoDB'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(16), default=generate_unique_hash, unique=True, nullable=False)
    email = Column(String(50), nullable=False, unique=True)
    password = Column(String(60), nullable=True)
    firstname = Column(String(15), nullable=False)
    lastname = Column(String(25), nullable=False)
    phone_number = Column(String(14), nullable=False)
    birthday = Column(Date, nullable=False)
    account_disabled = Column(Boolean, nullable=False, default=False)
    email_verified = Column(Boolean, nullable=False, default=False)

    stats = relationship("Stats", back_populates="user")
    player_instances = relationship("Players", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, name={self.lastname}, {self.firstname}, email={self.email})>"
