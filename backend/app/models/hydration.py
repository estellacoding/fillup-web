from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from uuid import uuid4

from ..core.database import Base

class Hydration(Base):
    """飲水記錄資料模型"""
    __tablename__ = "hydrations"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    volume: Mapped[int] = mapped_column(Integer, nullable=False)  # ml
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<Hydration(id={self.id}, volume={self.volume}ml, recorded_at={self.recorded_at})>"