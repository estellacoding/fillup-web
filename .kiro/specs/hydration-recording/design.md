# 設計文件

## 概述

飲水記錄功能採用前後端分離架構，前端使用 React 18 + Vite + Tailwind CSS + Zustand + Framer Motion 提供流暢的使用者體驗，後端使用 FastAPI + PostgreSQL 提供可靠的資料服務。系統支援離線優先設計，透過 IndexedDB 本地快取確保資料不遺失，並在網路恢復時自動同步。

## 架構

### 整體架構圖

```mermaid
graph TB
    subgraph "前端 (React 18)"
        A[Home 頁面] --> B[BucketVisualizer 元件]
        A --> C[QuickInputButtons 元件]
        A --> D[useHydrationStore 狀態]
        D --> E[hydration.service 服務]
        E --> F[IndexedDB 快取]
        E --> G[HTTP 客戶端]
    end
    
    subgraph "後端 (FastAPI)"
        H[/api/hydration 路由] --> I[HydrationService]
        I --> J[Hydration 模型]
        J --> K[PostgreSQL 資料庫]
    end
    
    G --> H
    F -.-> G
```

### 技術堆疊

**前端：**
- React 18 (函式元件 + Hooks)
- Vite (建置工具)
- Tailwind CSS + Shadcn/UI (樣式系統)
- Zustand (狀態管理)
- Framer Motion (動畫引擎)
- IndexedDB (離線儲存)

**後端：**
- FastAPI (Python Web 框架)
- PostgreSQL (主要資料庫)
- Pydantic (資料驗證)
- SQLAlchemy (ORM)

## 元件與介面

### 前端元件架構

#### 1. Home 頁面 (`frontend/src/pages/Home.tsx`)
- 主要容器元件，整合所有飲水記錄功能
- 管理頁面狀態與使用者互動
- 響應式設計，支援手機與桌面裝置

#### 2. BucketVisualizer 元件 (`frontend/src/components/BucketVisualizer.tsx`)
```typescript
interface BucketVisualizerProps {
  currentAmount: number;
  dailyGoal: number;
  isAnimating: boolean;
  onAnimationComplete?: () => void;
}
```
- 使用 Framer Motion 實現 60fps 流暢動畫
- SVG 基礎的水桶視覺化
- 支援百分比顯示與數值標示
- 達標慶祝動畫效果

#### 3. QuickInputButtons 元件 (`frontend/src/components/QuickInputButtons.tsx`)
```typescript
interface QuickInputButtonsProps {
  onVolumeSelect: (volume: number) => void;
  isLoading: boolean;
  presetVolumes: number[];
}
```
- 預設容量按鈕 (250ml, 350ml, 500ml)
- 自訂容量輸入欄位
- 載入狀態與錯誤處理
- 觸覺回饋與視覺確認

### 狀態管理

#### useHydrationStore (`frontend/src/store/useHydrationStore.ts`)
```typescript
interface HydrationState {
  // 狀態
  dailyIntake: number;
  dailyGoal: number;
  records: HydrationRecord[];
  isLoading: boolean;
  isOffline: boolean;
  
  // 動作
  addIntake: (volume: number) => Promise<void>;
  updateRecord: (id: string, updates: Partial<HydrationRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  syncOfflineData: () => Promise<void>;
  setDailyGoal: (goal: number) => void;
}
```

### 服務層

#### hydration.service (`frontend/src/services/hydration.service.ts`)
```typescript
class HydrationService {
  async createRecord(data: HydrationCreate): Promise<HydrationRecord>;
  async getDailySummary(date?: string): Promise<DailySummary>;
  async updateRecord(id: string, data: Partial<HydrationCreate>): Promise<HydrationRecord>;
  async deleteRecord(id: string): Promise<void>;
  
  // 離線支援
  async cacheRecord(record: HydrationRecord): Promise<void>;
  async syncCachedRecords(): Promise<void>;
  async getCachedRecords(): Promise<HydrationRecord[]>;
}
```

## 資料模型

### 前端資料模型

```typescript
interface HydrationRecord {
  id: string;
  volume: number; // ml
  timestamp: Date;
  synced: boolean;
  localId?: string; // 離線時的本地 ID
}

interface DailySummary {
  date: string;
  totalVolume: number;
  goalVolume: number;
  completionRate: number;
  recordCount: number;
}
```

### 後端資料模型

#### Hydration 模型 (`backend/app/models/hydration.py`)
```python
class Hydration(Base):
    __tablename__ = "hydrations"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    volume: Mapped[int] = mapped_column(Integer, nullable=False)  # ml
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
```

#### Pydantic Schemas (`backend/app/schemas/hydration.py`)
```python
class HydrationCreate(BaseModel):
    volume: int = Field(ge=1, le=2000, description="容量 (ml)")
    recorded_at: Optional[datetime] = Field(default_factory=datetime.now)

class HydrationUpdate(BaseModel):
    volume: Optional[int] = Field(None, ge=1, le=2000)
    recorded_at: Optional[datetime] = None

class HydrationOut(BaseModel):
    id: str
    volume: int
    recorded_at: datetime
    created_at: datetime
    updated_at: datetime

class DailySummaryOut(BaseModel):
    date: date
    total_volume: int
    goal_volume: int
    completion_rate: float
    record_count: int
```

## API 設計

### REST API 端點

#### POST /api/hydration
```yaml
summary: 建立新的飲水記錄
requestBody:
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/HydrationCreate'
responses:
  201:
    description: 記錄建立成功
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/HydrationOut'
  400:
    description: 輸入資料無效
  500:
    description: 伺服器錯誤
```

#### GET /api/hydration
```yaml
summary: 取得每日飲水彙總
parameters:
  - name: date
    in: query
    schema:
      type: string
      format: date
    description: 查詢日期 (預設為今日)
responses:
  200:
    description: 彙總資料
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/DailySummaryOut'
```

#### PUT /api/hydration/{id}
```yaml
summary: 更新飲水記錄
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
requestBody:
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/HydrationUpdate'
responses:
  200:
    description: 更新成功
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/HydrationOut'
  404:
    description: 記錄不存在
```

#### DELETE /api/hydration/{id}
```yaml
summary: 刪除飲水記錄
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
responses:
  204:
    description: 刪除成功
  404:
    description: 記錄不存在
```

## 離線支援與同步機制

### IndexedDB 結構
```typescript
interface OfflineRecord {
  localId: string;
  action: 'create' | 'update' | 'delete';
  data: HydrationRecord | Partial<HydrationRecord>;
  timestamp: number;
  retryCount: number;
}
```

### 同步策略
1. **離線檢測**: 使用 `navigator.onLine` 與 fetch 錯誤檢測
2. **資料快取**: 所有操作先寫入 IndexedDB
3. **衝突解決**: 使用時間戳優先順序
4. **重試機制**: 指數退避，最多重試 5 次
5. **批次同步**: 網路恢復時批次處理離線操作

## 動畫與效能

### Framer Motion 動畫配置
```typescript
const bucketAnimation = {
  initial: { scaleY: 0 },
  animate: { scaleY: currentPercentage / 100 },
  transition: {
    duration: 1.5,
    ease: "easeOut",
    type: "spring",
    stiffness: 100
  }
};

const celebrationAnimation = {
  scale: [1, 1.2, 1],
  rotate: [0, 10, -10, 0],
  transition: { duration: 0.8 }
};
```

### 效能最佳化
- 使用 `React.memo` 避免不必要的重新渲染
- 動畫使用 `transform` 屬性確保 GPU 加速
- IndexedDB 操作使用 Web Workers (如需要)
- 圖片與 SVG 最佳化

## 錯誤處理

### 前端錯誤處理
```typescript
class HydrationError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
  }
}

// 錯誤類型
const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SYNC_ERROR: 'SYNC_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR'
} as const;
```

### 後端錯誤處理
```python
class HydrationException(HTTPException):
    def __init__(self, status_code: int, detail: str, error_code: str):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code

# 錯誤回應格式
class ErrorResponse(BaseModel):
    error_code: str
    message: str
    details: Optional[Dict[str, Any]] = None
```

## 測試策略

### 前端測試
- **單元測試**: Jest + React Testing Library
- **元件測試**: 使用者互動與狀態變化
- **整合測試**: API 呼叫與錯誤處理
- **動畫測試**: Framer Motion 動畫觸發與完成

### 後端測試
- **單元測試**: pytest + 模擬資料庫
- **API 測試**: FastAPI TestClient
- **資料驗證測試**: Pydantic schema 驗證
- **效能測試**: 回應時間與併發處理

### 測試覆蓋率目標
- 前端: >85% 程式碼覆蓋率
- 後端: >90% 程式碼覆蓋率
- 關鍵路徑: 100% 覆蓋率