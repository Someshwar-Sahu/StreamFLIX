from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.user import Base

series_categories = Table(
    "series_categories",
    Base.metadata,
    Column("series_id", Integer, ForeignKey("series.id"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id"), primary_key=True),
)

class Series(Base):
    __tablename__ = "series"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    poster_url = Column(String, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    seasons = relationship("Season", back_populates="series", cascade="all, delete-orphan", order_by="Season.season_number")
    categories = relationship("Category", secondary=series_categories, backref="series_list")

class Season(Base):
    __tablename__ = "seasons"

    id = Column(Integer, primary_key=True)
    series_id = Column(Integer, ForeignKey("series.id"), nullable=False)
    season_number = Column(Integer, nullable=False)

    series = relationship("Series", back_populates="seasons")
    episodes = relationship("Episode", back_populates="season", cascade="all, delete-orphan", order_by="Episode.episode_number")

class Episode(Base):
    __tablename__ = "episodes"

    id = Column(Integer, primary_key=True)
    season_id = Column(Integer, ForeignKey("seasons.id"), nullable=False)
    episode_number = Column(Integer, nullable=False)
    title = Column(String, nullable=True)
    content_id = Column(Integer, ForeignKey("content.id"), nullable=False)

    season = relationship("Season", back_populates="episodes")
    content = relationship("Content")