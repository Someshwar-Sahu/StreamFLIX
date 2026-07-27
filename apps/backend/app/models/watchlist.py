from sqlalchemy import Column, Integer, ForeignKey, DateTime, CheckConstraint, Index
from datetime import datetime
from app.models.user import Base

class Watchlist(Base):
    __tablename__ = "watchlist"
    __table_args__ = (
        CheckConstraint(
            "(content_id IS NOT NULL AND series_id IS NULL) OR (content_id IS NULL AND series_id IS NOT NULL)",
            name="ck_watchlist_exactly_one_target",
        ),
        Index("uq_watchlist_profile_content", "profile_id", "content_id", unique=True, postgresql_where=Column("content_id").isnot(None)),
        Index("uq_watchlist_profile_series", "profile_id", "series_id", unique=True, postgresql_where=Column("series_id").isnot(None)),
    )
    id = Column(Integer, primary_key=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    content_id = Column(Integer, ForeignKey("content.id"), nullable=True)
    series_id = Column(Integer, ForeignKey("series.id"), nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow)