from typing import List, Optional
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from ..models.hydration import Hydration
from ..schemas.hydration import HydrationCreate, HydrationUpdate, DailySummaryOut
from ..core.config import settings

class HydrationService:
    """飲水記錄業務邏輯服務"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_record(self, data: HydrationCreate) -> Hydration:
        """建立新的飲水記錄"""
        record = Hydration(
            volume=data.volume,
            recorded_at=data.recorded_at or datetime.now()
        )
        
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        
        return record
    
    def get_record_by_id(self, record_id: str) -> Optional[Hydration]:
        """根據 ID 取得飲水記錄"""
        return self.db.query(Hydration).filter(Hydration.id == record_id).first()
    
    def update_record(self, record_id: str, data: HydrationUpdate) -> Optional[Hydration]:
        """更新飲水記錄"""
        record = self.get_record_by_id(record_id)
        if not record:
            return None
        
        # 更新欄位
        if data.volume is not None:
            record.volume = data.volume
        if data.recorded_at is not None:
            record.recorded_at = data.recorded_at
        
        self.db.commit()
        self.db.refresh(record)
        
        return record
    
    def delete_record(self, record_id: str) -> bool:
        """刪除飲水記錄"""
        record = self.get_record_by_id(record_id)
        if not record:
            return False
        
        self.db.delete(record)
        self.db.commit()
        
        return True
    
    def get_daily_records(self, target_date: date) -> List[Hydration]:
        """取得指定日期的所有記錄"""
        start_datetime = datetime.combine(target_date, datetime.min.time())
        end_datetime = datetime.combine(target_date, datetime.max.time())
        
        return self.db.query(Hydration).filter(
            and_(
                Hydration.recorded_at >= start_datetime,
                Hydration.recorded_at <= end_datetime
            )
        ).order_by(Hydration.recorded_at).all()
    
    def get_daily_summary(self, target_date: date, goal_volume: int = None) -> DailySummaryOut:
        """取得每日彙總統計"""
        if goal_volume is None:
            goal_volume = settings.default_daily_goal
            
        records = self.get_daily_records(target_date)
        
        total_volume = sum(record.volume for record in records)
        completion_rate = (total_volume / goal_volume) * 100 if goal_volume > 0 else 0
        
        return DailySummaryOut(
            date=target_date,
            total_volume=total_volume,
            goal_volume=goal_volume,
            completion_rate=completion_rate,
            record_count=len(records)
        )
    
    def validate_volume(self, volume: int) -> bool:
        """驗證容量是否在有效範圍內"""
        return settings.min_volume_per_record <= volume <= settings.max_volume_per_record
    
    def validate_recorded_time(self, recorded_at: datetime) -> bool:
        """驗證記錄時間是否合理"""
        now = datetime.now()
        # 不能是未來時間，且不能超過 30 天前
        return recorded_at <= now and (now - recorded_at).days <= 30

def get_hydration_service(db: Session) -> HydrationService:
    """取得飲水記錄服務實例"""
    return HydrationService(db)