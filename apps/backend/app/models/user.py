from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=False, default="viewer")
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_otp = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profiles = relationship("Profile", back_populates="account", cascade="all, delete-orphan")