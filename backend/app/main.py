from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import create_tables
from .api.routes import hydration

app = FastAPI(
    title=settings.app_name,
    description="飲水記錄追蹤 API",
    version=settings.app_version,
    debug=settings.debug
)

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化資料庫
@app.on_event("startup")
def startup_event():
    create_tables()

# 註冊路由
app.include_router(hydration.router, prefix=f"{settings.api_v1_str}/hydration", tags=["hydration"])

@app.get("/")
async def root():
    return {"message": "FillUp! Hydration API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}