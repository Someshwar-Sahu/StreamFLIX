from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.user import Base

class Content(Base):
    __tablename__ = "content"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    status = Column(String, default="processing")  
    duration = Column(Integer, nullable=True)  
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    variants = relationship("ContentVariant", back_populates="content")


class ContentVariant(Base):
    __tablename__ = "content_variants"

    id = Column(Integer, primary_key=True)
    content_id = Column(Integer, ForeignKey("content.id"), nullable=False)
    resolution = Column(String, nullable=False)  
    hls_path = Column(String, nullable=False)
    bitrate = Column(Integer, nullable=True)

    content = relationship("Content", back_populates="variants")