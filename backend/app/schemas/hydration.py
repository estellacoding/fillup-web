from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date
from typing import Optional

from ..core.config import settings

class HydrationCreate(BaseModel):
    """建立飲水記錄的輸入 schema"""
    volume: int = Field(
        ge=settings.min_volume_per_record, 
        le=settings.max_volume_per_record, 
        description="容量 (ml)"
    )
    recorded_at: Optional[datetime] = Field(default_factory=datetime.now, description="記錄時間")
    
    @field_validator('volume')
    @classmethod
    def validate_volume(cls, v):
        """驗證容量範圍"""
        if v < settings.min_volume_per_record or v > settings.max_volume_per_record:
            raise ValueError(
                f'容量必須介於 {settings.min_volume_per_record}ml 至 {settings.max_volume_per_record}ml 之間'
            )
        return v
    
    @field_validator('recorded_at')
    @classmethod
    def validate_recorded_at(cls, v):
        """驗證記錄時間不能超過當前時間"""
        if v and v > datetime.now():
            raise ValueError('記錄時間不能超過當前時間')
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "volume": 350,
                "recorded_at": "2024-01-15T10:30:00"
            }
        }
    }

class HydrationUpdate(BaseModel):
    """更新飲水記錄的輸入 schema"""
    volume: Optional[int] = Field(
        None, 
        ge=settings.min_volume_per_record, 
        le=settings.max_volume_per_record, 
        description="容量 (ml)"
    )
    recorded_at: Optional[datetime] = Field(None, description="記錄時間")
    
    @field_validator('volume')
    @classmethod
    def validate_volume(cls, v):
        """驗證容量範圍"""
        if v is not None and (v < settings.min_volume_per_record or v > settings.max_volume_per_record):
            raise ValueError(
                f'容量必須介於 {settings.min_volume_per_record}ml 至 {settings.max_volume_per_record}ml 之間'
            )
        return v
    
    @field_validator('recorded_at')
    @classmethod
    def validate_recorded_at(cls, v):
        """驗證記錄時間不能超過當前時間"""
        if v and v > datetime.now():
            raise ValueError('記錄時間不能超過當前時間')
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "volume": 500,
                "recorded_at": "2024-01-15T11:00:00"
            }
        }
    }

class HydrationOut(BaseModel):
    """飲水記錄的輸出 schema"""
    id: str
    volume: int
    recorded_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "hydration_1",
                "volume": 350,
                "recorded_at": "2024-01-15T10:30:00",
                "created_at": "2024-01-15T10:30:00",
                "updated_at": "2024-01-15T10:30:00"
            }
        }
    }

class DailySummaryOut(BaseModel):
    """每日彙總的輸出 schema"""
    date: date
    total_volume: int
    goal_volume: int
    completion_rate: float
    record_count: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "date": "2024-01-15",
                "total_volume": 1500,
                "goal_volume": 2000,
                "completion_rate": 75.0,
                "record_count": 4
            }
        }
    }


class ErrorResponse(BaseModel):
    """錯誤回應 schema"""
    error_code: str
    message: str
    details: Optional[dict] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "error_code": "VALIDATION_ERROR",
                "message": "輸入資料無效",
                "details": {
                    "field": "volume",
                    "issue": "容量必須介於 1ml 至 2000ml 之間"
                }
            }
        }
    }