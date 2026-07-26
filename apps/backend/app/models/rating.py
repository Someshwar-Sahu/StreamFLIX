from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from datetime import datetime
from app.models.user import Base

class Rating(Base):
    __tablename__ = "ratings"
    __table_args__ = (
        UniqueConstraint("profile_id", "content_id", name="uq_rating_profile_content"),
    )

    id = Column(Integer, primary_key=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    content_id = Column(Integer, ForeignKey("content.id"), nullable=False)
    value = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)