from sqlalchemy import Column, ForeignKey, Table, Integer, String, DateTime, Date, Boolean
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone, timedelta
from ..db import Base, CreatedAtColumn
from .hash import generate_unique_hash

class EmailVerifications(Base, CreatedAtColumn):
    __tablename__ = "email_verifications"
    __table_args__ = {'mysql_engine':'InnoDB'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash = Column(String(16), default=generate_unique_hash, unique=True, nullable=False)
    code = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc) + timedelta(minutes=10))

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    user = relationship("Users", back_populates="email_verification")

    def __repr__(self):
        return f"<Email_Verification(id={self.id}, user_id={self.user_id})>"