from sqlalchemy import Column, Integer, ForeignKey, DateTime
from datetime import datetime
from app.models.user import Base

class WatchHistory(Base):
    __tablename__ = "watch_history"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content_id = Column(Integer, ForeignKey("content.id"), nullable=False)
    progress_seconds = Column(Integer, default=0)
    duration_seconds = Column(Integer, nullable=True)
    last_watched_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)