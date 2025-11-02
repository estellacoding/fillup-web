from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """應用程式設定"""
    
    # 應用程式基本設定
    app_name: str = "FillUp! Hydration API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # 資料庫設定
    database_url: Optional[str] = None
    postgres_server: str = "localhost"
    postgres_user: str = "postgres"
    postgres_password: str = "password"
    postgres_db: str = "fillup_hydration"
    postgres_port: int = 5432
    
    # JWT 設定
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS 設定
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
    
    # API 設定
    api_v1_str: str = "/api"
    
    # 飲水記錄相關設定
    max_volume_per_record: int = 2000  # ml
    min_volume_per_record: int = 1     # ml
    default_daily_goal: int = 2000     # ml
    
    @property
    def database_url_complete(self) -> str:
        """完整的資料庫連線 URL"""
        if self.database_url:
            return self.database_url
        
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_server}:{self.postgres_port}/{self.postgres_db}"
        )
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# 建立設定實例
settings = Settings()