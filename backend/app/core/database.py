"""資料庫連線與設定模組"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from .config import settings

# 建立資料庫引擎
engine = create_engine(
    settings.database_url_complete,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=settings.debug
)

# 建立 Session 工廠
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 建立 Base 類別
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """取得資料庫 session 的依賴注入函式"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    """建立所有資料表"""
    Base.metadata.create_all(bind=engine)


def drop_tables() -> None:
    """刪除所有資料表 (僅用於開發/測試)"""
    Base.metadata.drop_all(bind=engine)