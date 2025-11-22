# 設計文件

## 概述

目標與設定功能為 FillUp! 應用程式提供個人化設定層，讓使用者能夠自訂每日飲水目標、活躍時段、計量單位偏好和快速輸入預設值。此功能採用前後端分離架構，前端使用 Zustand 進行狀態管理，後端使用 FastAPI 提供 RESTful API，資料持久化至 PostgreSQL。

設計的核心原則包括：
- **即時反應性**：設定變更立即反映在所有訂閱元件
- **資料一致性**：內部計算統一使用毫升，僅在顯示層轉換單位
- **錯誤復原**：API 失敗時自動還原狀態變更
- **使用者體驗**：流暢的單位切換和即時的進度回饋

## 架構

### 系統架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                        前端層 (React)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │ Settings頁面  │      │   Home頁面    │                     │
│  │              │      │              │                     │
│  │ - 目標設定    │      │ - 完成率顯示  │                     │
│  │ - 時段設定    │      │ - 節奏指標    │                     │
│  │ - 單位切換    │      │ - 快速輸入    │                     │
│  │ - 預設管理    │      │              │                     │
│  └──────┬───────┘      └──────┬───────┘                     │
│         │                     │                             │
│         └──────────┬──────────┘                             │
│                    │                                         │
│         ┌──────────▼──────────┐                             │
│         │  useSettingsStore   │ (Zustand)                   │
│         │                     │                             │
│         │ - dailyGoalMl       │                             │
│         │ - activeFrom/To     │                             │
│         │ - unitPreference    │                             │
│         │ - presets           │                             │
│         └──────────┬──────────┘                             │
│                    │                                         │
│         ┌──────────▼──────────┐                             │
│         │  goals.service.ts   │                             │
│         │                     │                             │
│         │ - fetchGoals()      │                             │
│         │ - updateGoals()     │                             │
│         └──────────┬──────────┘                             │
│                    │                                         │
└────────────────────┼─────────────────────────────────────────┘
                     │ HTTP (REST)
┌────────────────────▼─────────────────────────────────────────┐
│                      後端層 (FastAPI)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│         ┌──────────────────────┐                             │
│         │  /api/goals 路由      │                             │
│         │                      │                             │
│         │ - GET  /api/goals    │                             │
│         │ - PUT  /api/goals    │                             │
│         └──────────┬───────────┘                             │
│                    │                                         │
│         ┌──────────▼───────────┐                             │
│         │   Goal Model         │ (SQLAlchemy)                │
│         │                      │                             │
│         │ - id                 │                             │
│         │ - user_id            │                             │
│         │ - daily_goal_ml      │                             │
│         │ - active_from        │                             │
│         │ - active_to          │                             │
│         │ - presets_json       │                             │
│         │ - updated_at         │                             │
│         └──────────┬───────────┘                             │
│                    │                                         │
└────────────────────▼─────────────────────────────────────────┘
                     │
              ┌──────▼──────┐
              │ PostgreSQL  │
              └─────────────┘
```

### 資料流

1. **初始化流程**
   - 應用程式啟動 → 呼叫 `fetchGoals()` → 從後端載入設定 → 更新 `useSettingsStore`
   - Home 頁面訂閱 store → 根據設定計算完成率和節奏指標

2. **設定更新流程**
   - 使用者在 Settings 頁面修改設定 → 樂觀更新 store → 呼叫 `updateGoals()` API
   - API 成功 → 保持 store 狀態 → 通知所有訂閱者
   - API 失敗 → 還原 store 至先前狀態 → 顯示錯誤訊息

3. **單位切換流程**
   - 使用者切換單位 → 更新 `unitPreference` → 觸發所有顯示值重新計算
   - 內部資料（store 中的 ml 值）保持不變 → 僅顯示層轉換

## 元件與介面

### 前端元件

#### 1. Settings 頁面元件

**檔案位置**: `frontend/src/pages/Settings.tsx`

**職責**:
- 顯示和編輯所有使用者設定
- 驗證輸入值
- 處理表單提交和錯誤

**介面**:
```typescript
interface SettingsPageProps {}

// 內部狀態
interface SettingsFormState {
  dailyGoal: number;        // 顯示單位的值
  activeFrom: string;       // HH:mm 格式
  activeTo: string;         // HH:mm 格式
  unitPreference: 'ml' | 'oz';
  presets: number[];        // 顯示單位的值
}
```

**主要功能**:
- `handleGoalChange(value: number)`: 驗證並更新目標值
- `handleTimeChange(field: 'from' | 'to', value: string)`: 驗證並更新時段
- `handleUnitToggle()`: 切換單位並轉換所有顯示值
- `handlePresetChange(index: number, value: number)`: 更新特定預設值
- `handleAddPreset()`: 新增預設值（最多 5 個）
- `handleRemovePreset(index: number)`: 移除預設值（至少保留 1 個）
- `handleSubmit()`: 提交表單並處理錯誤

#### 2. Home 頁面增強

**檔案位置**: `frontend/src/pages/Home.tsx`

**新增功能**:
- 完成率計算和顯示
- 節奏指標計算和顯示
- 從 `useSettingsStore` 訂閱設定變更

**新增介面**:
```typescript
interface ProgressInfo {
  completionRate: number;      // 0-100
  rhythmStatus: 'ahead' | 'on-track' | 'behind' | 'inactive';
  rhythmMessage: string;
}
```

**計算邏輯**:
```typescript
function calculateProgress(
  currentIntakeMl: number,
  dailyGoalMl: number,
  activeFrom: string,
  activeTo: string,
  currentTime: Date
): ProgressInfo
```

#### 3. QuickInputButtons 元件增強

**檔案位置**: `frontend/src/components/QuickInputButtons.tsx`

**變更**:
- 從 `useSettingsStore` 讀取預設容量
- 根據 `unitPreference` 顯示按鈕標籤
- 點擊時轉換為 ml 並記錄

### 狀態管理

#### useSettingsStore (Zustand)

**檔案位置**: `frontend/src/store/useSettingsStore.ts`

**狀態結構**:
```typescript
interface SettingsState {
  // 資料（內部統一使用 ml）
  dailyGoalMl: number;
  activeFrom: string;          // HH:mm 格式
  activeTo: string;            // HH:mm 格式
  unitPreference: 'ml' | 'oz';
  presets: number[];           // 以 ml 儲存
  updatedAt: string | null;
  
  // 載入狀態
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchGoals: () => Promise<void>;
  updateGoals: (updates: Partial<GoalSettings>) => Promise<void>;
  setUnitPreference: (unit: 'ml' | 'oz') => Promise<void>;
  
  // 輔助方法
  getDisplayValue: (mlValue: number) => number;
  getNormalizedValue: (displayValue: number) => number;
}

interface GoalSettings {
  dailyGoalMl: number;
  activeFrom: string;
  activeTo: string;
  presets: number[];
}
```

**關鍵實作細節**:
- 使用樂觀更新策略提升使用者體驗
- API 失敗時自動還原狀態
- 提供單位轉換輔助方法

### 服務層

#### goals.service.ts

**檔案位置**: `frontend/src/services/goals.service.ts`

**介面**:
```typescript
interface GoalResponse {
  daily_goal_ml: number;
  active_from: string;
  active_to: string;
  presets_json: number[];
  unit_preference?: 'ml' | 'oz';
  updated_at: string;
}

interface GoalUpdateRequest {
  daily_goal_ml?: number;
  active_from?: string;
  active_to?: string;
  presets_json?: number[];
  unit_preference?: 'ml' | 'oz';
}

export const goalsService = {
  fetchGoals: (): Promise<GoalResponse>;
  updateGoals: (data: GoalUpdateRequest): Promise<GoalResponse>;
};
```

### 工具模組

#### units.ts

**檔案位置**: `frontend/src/utils/units.ts`

**介面**:
```typescript
const ML_TO_OZ = 0.033814;
const OZ_TO_ML = 29.5735;

export const units = {
  mlToOz: (ml: number): number;
  ozToMl: (oz: number): number;
  formatVolume: (ml: number, unit: 'ml' | 'oz'): string;
  parseVolume: (value: string, unit: 'ml' | 'oz'): number;
};
```

**實作細節**:
- 液體盎司四捨五入至小數點後 1 位
- 毫升顯示為整數
- 處理邊界情況（零、負值）

### 後端元件

#### Goal Model

**檔案位置**: `backend/app/models/goal.py`

**Schema**:
```python
class Goal(Base):
    __tablename__ = "goals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    daily_goal_ml = Column(Integer, nullable=False)
    active_from = Column(String(5), nullable=False)  # HH:mm
    active_to = Column(String(5), nullable=False)    # HH:mm
    presets_json = Column(JSON, nullable=False)      # List[int]
    unit_preference = Column(String(2), default="ml")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 關聯
    user = relationship("User", back_populates="goal")
```

**約束**:
- `daily_goal_ml`: 500 ≤ value ≤ 5000
- `active_from` < `active_to`
- `presets_json`: 1 ≤ length ≤ 5, 每個值 50 ≤ value ≤ 2000

#### Pydantic Schemas

**檔案位置**: `backend/app/schemas/goal.py`

```python
class GoalBase(BaseModel):
    daily_goal_ml: int = Field(ge=500, le=5000)
    active_from: str = Field(pattern=r"^([0-1][0-9]|2[0-3]):[0-5][0-9]$")
    active_to: str = Field(pattern=r"^([0-1][0-9]|2[0-3]):[0-5][0-9]$")
    presets_json: List[int] = Field(min_items=1, max_items=5)
    unit_preference: Literal["ml", "oz"] = "ml"
    
    @validator("presets_json")
    def validate_presets(cls, v):
        for preset in v:
            if not (50 <= preset <= 2000):
                raise ValueError("每個預設值必須介於 50ml 至 2000ml 之間")
        return v
    
    @validator("active_to")
    def validate_time_range(cls, v, values):
        if "active_from" in values:
            from_time = datetime.strptime(values["active_from"], "%H:%M").time()
            to_time = datetime.strptime(v, "%H:%M").time()
            if from_time >= to_time:
                raise ValueError("active_to 必須晚於 active_from")
        return v

class GoalUpsert(GoalBase):
    pass

class GoalOut(GoalBase):
    id: int
    user_id: int
    updated_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True
```

#### API Routes

**檔案位置**: `backend/app/api/routes/goals.py`

```python
@router.get("/goals", response_model=GoalOut)
async def get_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> GoalOut:
    """取得使用者的目標設定"""
    pass

@router.put("/goals", response_model=GoalOut)
async def update_goals(
    goal_data: GoalUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> GoalOut:
    """更新使用者的目標設定"""
    pass
```

## 資料模型

### 前端資料模型

```typescript
// Store 中的資料（正規化為 ml）
interface SettingsData {
  dailyGoalMl: number;
  activeFrom: string;
  activeTo: string;
  unitPreference: 'ml' | 'oz';
  presets: number[];        // 以 ml 儲存
  updatedAt: string | null;
}

// 顯示層資料（根據 unitPreference 轉換）
interface DisplaySettings {
  dailyGoal: number;        // 可能是 ml 或 oz
  activeFrom: string;
  activeTo: string;
  unit: 'ml' | 'oz';
  presets: number[];        // 可能是 ml 或 oz
}

// 進度計算資料
interface ProgressData {
  currentIntakeMl: number;
  dailyGoalMl: number;
  completionRate: number;
  expectedProgress: number;
  rhythmStatus: 'ahead' | 'on-track' | 'behind' | 'inactive';
}
```

### 後端資料模型

```python
# 資料庫模型
class Goal(Base):
    id: int
    user_id: int
    daily_goal_ml: int
    active_from: str
    active_to: str
    presets_json: List[int]
    unit_preference: str
    updated_at: datetime
    created_at: datetime

# API 回應模型
class GoalOut(BaseModel):
    id: int
    user_id: int
    daily_goal_ml: int
    active_from: str
    active_to: str
    presets_json: List[int]
    unit_preference: str
    updated_at: datetime
    created_at: datetime
```

### 資料轉換規則

1. **單位轉換**
   - ml → oz: `oz = ml * 0.033814`，四捨五入至小數點後 1 位
   - oz → ml: `ml = oz * 29.5735`，四捨五入至整數

2. **時間格式**
   - 儲存格式: `HH:mm` (24 小時制)
   - 顯示格式: 根據使用者地區設定

3. **預設值儲存**
   - 後端: JSON 陣列 `[250, 350, 500]`
   - 前端: TypeScript 陣列 `number[]`


## 正確性屬性

*屬性是一個特徵或行為，應該在系統的所有有效執行中保持為真 - 本質上是關於系統應該做什麼的正式陳述。屬性作為人類可讀規格和機器可驗證正確性保證之間的橋樑。*

### 屬性 1：目標值驗證範圍

*對於任何* 輸入的每日目標值，驗證函式應該接受介於 500ml 至 5000ml 之間的值，並拒絕此範圍外的值
**驗證：需求 1.2**

### 屬性 2：目標更新反應性

*對於任何* 有效的每日目標更新，主頁面的完成率應該立即重新計算，無需手動重新整理
**驗證：需求 1.4**

### 屬性 3：時間範圍驗證

*對於任何* 活躍時段設定，系統應該拒絕開始時間晚於或等於結束時間的設定
**驗證：需求 2.2, 2.3**

### 屬性 4：活躍時段更新反應性

*對於任何* 有效的活躍時段更新，主頁面的節奏指標應該根據新時間範圍立即重新計算
**驗證：需求 2.5**

### 屬性 5：單位轉換即時性

*對於任何* 單位偏好切換，所有顯示值應該立即轉換為所選單位，且轉換應該是雙向一致的
**驗證：需求 3.2**

### 屬性 6：內部資料正規化不變性

*對於任何* 單位偏好變更，內部儲存的毫升值應該保持不變，確保資料一致性
**驗證：需求 3.3, 7.4**

### 屬性 7：單位轉換往返一致性

*對於任何* 毫升值，執行 ml → oz → ml 的往返轉換後，結果應該在 0.01ml 容差範圍內等於原始值
**驗證：需求 3.5, 9.1**

### 屬性 8：預設容量數量限制

*對於任何* 預設容量陣列，系統應該維持 1 ≤ 長度 ≤ 5 的約束
**驗證：需求 4.3, 4.4**

### 屬性 9：預設容量值驗證

*對於任何* 預設容量值，驗證函式應該接受介於 50ml 至 2000ml 之間的值，並拒絕此範圍外的值
**驗證：需求 4.2**

### 屬性 10：預設容量序列化往返

*對於任何* 預設容量陣列，序列化為 JSON 後再反序列化應該產生相同的陣列
**驗證：需求 4.5**

### 屬性 11：完成率計算正確性

*對於任何* 當前攝取量和每日目標，完成率應該等於 (當前攝取量 / 每日目標) × 100，並限制在 0-100 範圍內
**驗證：需求 5.1**


### 屬性 12：預期進度計算正確性

*對於任何* 活躍時段和當前時間（在時段內），預期進度應該等於 (已過時間 / 總時段長度) × 100
**驗證：需求 5.2**

### 屬性 13：節奏指標狀態正確性

*對於任何* 當前攝取量和預期進度，當攝取量 > 預期進度時應顯示「超前」，當攝取量 < 預期進度時應顯示「落後」，當攝取量 ≈ 預期進度時應顯示「按進度」
**驗證：需求 5.3, 5.4**

### 屬性 14：時段外節奏指標隱藏

*對於任何* 當前時間在活躍時段外的情況，系統應該僅顯示完成率而不顯示節奏指標
**驗證：需求 5.5**

### 屬性 15：樂觀更新順序

*對於任何* 設定更新操作，設定儲存庫的更新應該發生在 API 呼叫之前
**驗證：需求 6.2**

### 屬性 16：API 失敗狀態還原

*對於任何* 導致 API 失敗的設定更新，設定儲存庫應該還原至更新前的狀態
**驗證：需求 6.3**

### 屬性 17：訂閱者通知即時性

*對於任何* 設定儲存庫的狀態變更，所有訂閱的元件應該立即收到通知
**驗證：需求 6.4**

### 屬性 18：單位轉換係數正確性

*對於任何* ml 到 oz 的轉換，結果應該等於 ml × 0.033814（四捨五入至小數點後 1 位）
*對於任何* oz 到 ml 的轉換，結果應該等於 oz × 29.5735（四捨五入至整數）
**驗證：需求 7.1, 7.2**

### 屬性 19：液體盎司顯示格式

*對於任何* 以液體盎司顯示的值，應該四捨五入至小數點後 1 位
**驗證：需求 7.3**

### 屬性 20：API 回應完整性

*對於任何* 對 /api/goals 的 GET 請求，回應應該包含所有必要欄位：daily_goal_ml、active_from、active_to、presets_json
**驗證：需求 8.1**

### 屬性 21：API 更新冪等性

*對於任何* 有效的目標設定，連續兩次使用相同資料的 PUT 請求應該產生相同的結果
**驗證：需求 8.2**

### 屬性 22：API 驗證錯誤回應

*對於任何* 包含無效資料的 PUT 請求，API 應該回傳 422 狀態碼及描述性錯誤訊息
**驗證：需求 8.3**

### 屬性 23：時間範圍 Schema 驗證

*對於任何* 目標設定更新，如果 active_from ≥ active_to，schema 驗證應該拒絕該請求
**驗證：需求 8.4**


## 錯誤處理

### 前端錯誤處理

#### 1. 輸入驗證錯誤

**情境**：使用者輸入無效的目標值、時間或預設容量

**處理策略**：
- 即時驗證：在輸入欄位失去焦點時驗證
- 顯示內聯錯誤訊息，指出具體問題
- 禁用儲存按鈕直到所有輸入有效
- 錯誤訊息範例：
  - "每日目標必須介於 500ml 至 5000ml 之間"
  - "結束時間必須晚於開始時間"
  - "預設容量必須介於 50ml 至 2000ml 之間"

#### 2. API 通訊錯誤

**情境**：網路錯誤、伺服器錯誤、逾時

**處理策略**：
- 使用樂觀更新：先更新 UI，再呼叫 API
- API 失敗時自動還原 store 狀態
- 顯示 toast 通知說明錯誤
- 提供重試選項
- 錯誤訊息範例：
  - "無法儲存設定，請檢查網路連線"
  - "伺服器暫時無法回應，請稍後再試"

#### 3. 狀態同步錯誤

**情境**：多個元件同時更新設定、併發請求

**處理策略**：
- 使用 Zustand 的原子性更新
- 實作請求佇列，避免併發更新
- 使用樂觀鎖定（版本號或時間戳記）
- 衝突時以最後寫入為準

#### 4. 單位轉換錯誤

**情境**：轉換過程中的精度損失、邊界值

**處理策略**：
- 使用固定精度的轉換係數
- 內部統一使用 ml，避免重複轉換
- 處理零值和負值（雖然不應出現）
- 記錄異常轉換以供除錯

### 後端錯誤處理

#### 1. 請求驗證錯誤

**情境**：請求資料不符合 schema

**處理策略**：
- 使用 Pydantic 自動驗證
- 回傳 422 狀態碼及詳細錯誤訊息
- 錯誤回應格式：
```json
{
  "detail": [
    {
      "loc": ["body", "daily_goal_ml"],
      "msg": "ensure this value is greater than or equal to 500",
      "type": "value_error.number.not_ge"
    }
  ]
}
```

#### 2. 資料庫錯誤

**情境**：連線失敗、查詢錯誤、約束違反

**處理策略**：
- 使用資料庫交易確保原子性
- 捕獲並記錄資料庫異常
- 回傳 500 狀態碼及通用錯誤訊息（不洩漏內部細節）
- 實作重試邏輯（針對暫時性錯誤）

#### 3. 業務邏輯錯誤

**情境**：時間範圍無效、預設值數量超限

**處理策略**：
- 在 Pydantic validator 中實作業務規則
- 回傳 422 狀態碼及描述性錯誤訊息
- 記錄違規嘗試以供分析

#### 4. 認證/授權錯誤

**情境**：未認證使用者、存取他人資料

**處理策略**：
- 使用 JWT 驗證使用者身份
- 確保使用者只能存取自己的設定
- 回傳 401（未認證）或 403（未授權）狀態碼

### 錯誤記錄與監控

- 前端：使用 console.error 記錄錯誤，生產環境整合錯誤追蹤服務（如 Sentry）
- 後端：使用結構化日誌記錄所有錯誤，包含請求 ID、使用者 ID、時間戳記
- 監控：追蹤錯誤率、API 回應時間、失敗的驗證嘗試


## 測試策略

### 單元測試

單元測試專注於驗證個別函式和元件的正確性，包括特定範例、邊界情況和錯誤條件。

#### 前端單元測試

**測試框架**：Vitest + React Testing Library

**測試範圍**：

1. **單位轉換工具 (utils/units.ts)**
   - 測試 ml 到 oz 轉換的準確性
   - 測試 oz 到 ml 轉換的準確性
   - 測試四捨五入邏輯
   - 測試邊界值（0, 負值, 極大值）
   - 測試格式化函式

2. **設定儲存庫 (useSettingsStore.ts)**
   - 測試初始狀態
   - 測試 action 函式（fetchGoals, updateGoals）
   - 測試樂觀更新邏輯
   - 測試錯誤還原邏輯
   - 測試輔助方法（getDisplayValue, getNormalizedValue）

3. **進度計算邏輯**
   - 測試完成率計算
   - 測試預期進度計算
   - 測試節奏狀態判斷
   - 測試時段內外的不同行為

4. **驗證函式**
   - 測試目標值範圍驗證
   - 測試時間範圍驗證
   - 測試預設容量驗證
   - 測試預設數量限制

#### 後端單元測試

**測試框架**：pytest

**測試範圍**：

1. **Pydantic Schemas (schemas/goal.py)**
   - 測試欄位驗證（範圍、格式）
   - 測試自訂 validator
   - 測試序列化/反序列化

2. **API 路由 (routes/goals.py)**
   - 測試 GET /api/goals 回應格式
   - 測試 PUT /api/goals 更新邏輯
   - 測試錯誤回應（400, 422, 500）
   - 測試認證/授權

3. **資料庫模型 (models/goal.py)**
   - 測試模型建立
   - 測試關聯關係
   - 測試約束條件

### 屬性基礎測試 (Property-Based Testing)

屬性基礎測試驗證應該在所有輸入中保持的通用屬性，提供比單元測試更廣泛的覆蓋。

**測試框架**：
- 前端：fast-check
- 後端：Hypothesis

**測試配置**：
- 每個屬性測試執行至少 100 次迭代
- 使用智慧生成器約束輸入空間

**測試範圍**：

#### 前端屬性測試

1. **屬性 7：單位轉換往返一致性**
   - 生成器：隨機 ml 值（500-5000）
   - 測試：ml → oz → ml 應在 0.01ml 容差內相等
   - 標記：**Feature: goals-and-settings, Property 7: 單位轉換往返一致性**

2. **屬性 10：預設容量序列化往返**
   - 生成器：隨機預設容量陣列（1-5 個元素，每個 50-2000ml）
   - 測試：JSON.stringify → JSON.parse 應產生相同陣列
   - 標記：**Feature: goals-and-settings, Property 10: 預設容量序列化往返**

3. **屬性 11：完成率計算正確性**
   - 生成器：隨機攝取量（0-10000ml）和目標（500-5000ml）
   - 測試：完成率 = (攝取量 / 目標) × 100，限制在 0-100
   - 標記：**Feature: goals-and-settings, Property 11: 完成率計算正確性**

4. **屬性 12：預期進度計算正確性**
   - 生成器：隨機時段和當前時間（在時段內）
   - 測試：預期進度 = (已過時間 / 總時長) × 100
   - 標記：**Feature: goals-and-settings, Property 12: 預期進度計算正確性**

5. **屬性 18：單位轉換係數正確性**
   - 生成器：隨機 ml 和 oz 值
   - 測試：轉換結果符合係數 1 oz = 29.5735 ml
   - 標記：**Feature: goals-and-settings, Property 18: 單位轉換係數正確性**

#### 後端屬性測試

1. **屬性 21：API 更新冪等性**
   - 生成器：隨機有效目標設定
   - 測試：連續兩次相同 PUT 請求產生相同結果
   - 標記：**Feature: goals-and-settings, Property 21: API 更新冪等性**

2. **屬性 22：API 驗證錯誤回應**
   - 生成器：隨機無效目標設定（違反各種約束）
   - 測試：所有無效請求回傳 422 狀態碼
   - 標記：**Feature: goals-and-settings, Property 22: API 驗證錯誤回應**

3. **屬性 23：時間範圍 Schema 驗證**
   - 生成器：隨機時間對（包括無效組合）
   - 測試：active_from ≥ active_to 的請求被拒絕
   - 標記：**Feature: goals-and-settings, Property 23: 時間範圍 Schema 驗證**

### 整合測試

整合測試驗證多個元件協同工作的正確性。

**測試範圍**：

1. **前後端整合**
   - 測試完整的設定更新流程（前端 → API → 資料庫 → 回應）
   - 測試 API 失敗時的狀態還原
   - 測試併發請求處理

2. **元件間整合**
   - 測試 Settings 頁面更新後 Home 頁面立即反映
   - 測試 store 變更通知所有訂閱元件
   - 測試單位切換影響所有顯示值

### 端對端測試

端對端測試驗證完整的使用者流程。

**測試框架**：Playwright 或 Cypress

**測試場景**：

1. **設定目標流程**
   - 使用者進入 Settings 頁面
   - 修改每日目標
   - 儲存設定
   - 驗證 Home 頁面完成率更新

2. **單位切換流程**
   - 使用者切換單位從 ml 到 oz
   - 驗證所有顯示值正確轉換
   - 切換回 ml
   - 驗證資料無損失

3. **預設容量管理流程**
   - 使用者新增/修改/刪除預設值
   - 儲存設定
   - 驗證 Home 頁面快速輸入按鈕更新

### 測試覆蓋率目標

- 單元測試：> 80% 程式碼覆蓋率
- 屬性測試：覆蓋所有核心正確性屬性
- 整合測試：覆蓋所有主要元件互動
- 端對端測試：覆蓋所有關鍵使用者流程

### 測試執行策略

- 本地開發：執行單元測試和屬性測試
- CI/CD：執行所有測試（單元、屬性、整合、端對端）
- 使用靜默模式避免逾時：`npm test -- --silent`
- 失敗時提供詳細錯誤資訊


## 設計決策與權衡

### 1. 樂觀更新 vs 悲觀更新

**決策**：採用樂觀更新策略

**理由**：
- 提供更好的使用者體驗（即時回饋）
- 減少感知延遲
- 網路錯誤相對罕見

**權衡**：
- 需要實作錯誤還原邏輯
- 可能出現短暫的不一致狀態

### 2. 內部資料正規化

**決策**：內部統一使用毫升，僅在顯示層轉換

**理由**：
- 避免重複轉換導致的精度損失
- 簡化計算邏輯
- 確保資料一致性

**權衡**：
- 需要在每個顯示點進行轉換
- 增加顯示層的複雜度

### 3. Zustand vs Redux

**決策**：使用 Zustand 進行狀態管理

**理由**：
- 更簡潔的 API
- 更小的 bundle 大小
- 足夠的功能性（對於此功能）
- 更好的 TypeScript 支援

**權衡**：
- 生態系統較小
- 較少的中介軟體選項

### 4. 預設容量儲存格式

**決策**：後端使用 JSON 欄位儲存陣列

**理由**：
- 靈活性（可變長度陣列）
- 避免額外的關聯表
- 簡化查詢

**權衡**：
- 無法在 SQL 層面進行陣列元素查詢
- 需要應用層驗證

### 5. 時間格式

**決策**：使用 HH:mm 字串格式儲存時間

**理由**：
- 簡單且人類可讀
- 避免時區問題（僅儲存時間，不含日期）
- 易於驗證

**權衡**：
- 需要字串解析進行時間計算
- 無法利用資料庫的時間函式

## 效能考量

### 前端效能

1. **狀態更新優化**
   - 使用 Zustand 的選擇器避免不必要的重新渲染
   - 僅訂閱需要的狀態片段

2. **單位轉換快取**
   - 考慮快取轉換結果（如果轉換頻繁）
   - 使用 useMemo 避免重複計算

3. **API 請求優化**
   - 實作請求去抖動（debounce）避免頻繁更新
   - 使用請求取消避免競態條件

### 後端效能

1. **資料庫查詢優化**
   - 在 user_id 上建立索引
   - 使用連線池管理資料庫連線

2. **API 回應優化**
   - 僅回傳必要欄位
   - 考慮使用 gzip 壓縮

## 安全考量

### 前端安全

1. **輸入驗證**
   - 客戶端驗證作為第一道防線
   - 不信任客戶端驗證結果

2. **敏感資料處理**
   - 不在前端儲存敏感資訊
   - 使用 HTTPS 傳輸所有資料

### 後端安全

1. **認證與授權**
   - 使用 JWT 驗證使用者身份
   - 確保使用者只能存取自己的資料

2. **輸入驗證**
   - 使用 Pydantic 嚴格驗證所有輸入
   - 防止 SQL 注入（使用 ORM）

3. **速率限制**
   - 實作 API 速率限制防止濫用
   - 記錄異常請求模式

## 可擴展性考量

### 未來功能擴展

1. **多使用者支援**
   - 當前設計已支援多使用者（透過 user_id）
   - 可輕鬆擴展至團隊或家庭帳戶

2. **更多單位支援**
   - 架構支援新增其他單位（如公升、杯）
   - 僅需擴展 units.ts 和更新 UI

3. **智慧預設值建議**
   - 可基於使用者歷史記錄建議預設值
   - 不影響現有架構

4. **時段模板**
   - 可新增預設時段模板（工作日、週末）
   - 擴展 API 和 UI 即可

### 資料遷移策略

- 使用 Alembic 管理資料庫 schema 變更
- 向後相容的 API 變更
- 版本化的前端資料格式

## 監控與可觀測性

### 關鍵指標

1. **功能指標**
   - 設定更新成功率
   - 平均 API 回應時間
   - 單位切換頻率

2. **錯誤指標**
   - API 錯誤率（按錯誤類型分類）
   - 前端錯誤率
   - 驗證失敗率

3. **使用者行為指標**
   - 平均每日目標值
   - 最常用的預設容量
   - 單位偏好分布

### 日誌策略

- 前端：記錄關鍵使用者操作和錯誤
- 後端：結構化日誌包含請求 ID、使用者 ID、操作類型
- 生產環境：整合 APM 工具（如 New Relic、Datadog）

