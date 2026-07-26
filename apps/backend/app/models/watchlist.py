from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from datetime import datetime
from app.models.user import Base

class Watchlist(Base):
    __tablename__ = "watchlist"
    __table_args__ = (
        UniqueConstraint("profile_id", "content_id", name="uq_watchlist_profile_content"),
    )
    id = Column(Integer, primary_key=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    content_id = Column(Integer, ForeignKey("content.id"), nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow)