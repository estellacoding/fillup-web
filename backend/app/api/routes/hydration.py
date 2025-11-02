from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime

from ...core.database import get_db
from ...schemas.hydration import HydrationCreate, HydrationUpdate, HydrationOut, DailySummaryOut, ErrorResponse
from ...services.hydration_service import get_hydration_service

router = APIRouter()

@router.post("/", response_model=HydrationOut, status_code=201)
def create_hydration_record(
    data: HydrationCreate,
    db: Session = Depends(get_db)
):
    """建立新的飲水記錄"""
    try:
        service = get_hydration_service(db)
        record = service.create_record(data)
        return HydrationOut.model_validate(record)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"建立記錄失敗: {str(e)}")

@router.get("/", response_model=DailySummaryOut)
def get_daily_summary(
    query_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """取得每日飲水彙總"""
    try:
        target_date = date.fromisoformat(query_date) if query_date else date.today()
        service = get_hydration_service(db)
        return service.get_daily_summary(target_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="日期格式無效")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"取得彙總失敗: {str(e)}")

@router.put("/{record_id}", response_model=HydrationOut)
def update_hydration_record(
    record_id: str,
    data: HydrationUpdate,
    db: Session = Depends(get_db)
):
    """更新飲水記錄"""
    try:
        service = get_hydration_service(db)
        record = service.update_record(record_id, data)
        
        if not record:
            raise HTTPException(status_code=404, detail="記錄不存在")
        
        return HydrationOut.model_validate(record)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新記錄失敗: {str(e)}")

@router.delete("/{record_id}", status_code=204)
def delete_hydration_record(
    record_id: str,
    db: Session = Depends(get_db)
):
    """刪除飲水記錄"""
    try:
        service = get_hydration_service(db)
        success = service.delete_record(record_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="記錄不存在")
        
        return
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"刪除記錄失敗: {str(e)}")