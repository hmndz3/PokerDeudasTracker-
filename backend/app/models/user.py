import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum

from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    PLAYER = "player"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    real_name = Column(String(120), nullable=False)  # inmutable
    username = Column(String(60), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.PLAYER)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )