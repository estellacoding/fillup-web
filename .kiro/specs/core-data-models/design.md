# 設計文件

## 概述

FillUp! 核心資料模型採用 TypeScript 嚴格型別系統，提供五個主要資料結構：User Profile、Water Record、Daily Progress、Achievement 與 Streak。設計遵循型別安全、資料驗證與關聯完整性原則，支援遊戲化飲水追蹤的所有核心功能。

### 設計目標

1. **型別安全**：利用 TypeScript 嚴格模式在編譯時期捕捉錯誤
2. **資料完整性**：透過驗證函式確保所有資料符合業務規則
3. **可擴展性**：模組化設計便於未來功能擴充
4. **效能**：輕量級資料結構，最小化記憶體佔用
5. **可維護性**：清晰的介面定義與文件註解

## 架構

### 資料模型層次結構

```
┌─────────────────────────────────────────┐
│         User Profile (核心)              │
│  - 使用者設定                             │
│  - 遊戲化進度                             │
└─────────────┬───────────────────────────┘
              │
              ├──────────────┬──────────────┬──────────────┐
              │              │              │              │
    ┌─────────▼────┐  ┌─────▼──────┐  ┌───▼────────┐  ┌──▼──────┐
    │ Water Record │  │   Daily    │  │Achievement │  │ Streak  │
    │   (多對一)    │  │  Progress  │  │  (多對多)   │  │(一對一) │
    │              │  │  (一對多)   │  │            │  │         │
    └──────────────┘  └────────────┘  └────────────┘  └─────────┘
```

### 技術棧

- **語言**：TypeScript 5.x+
- **型別系統**：嚴格模式 (`strict: true`)
- **驗證**：自訂驗證函式，回傳 Result 型別
- **日期處理**：ISO 8601 標準格式
- **識別碼**：UUID v4 或自增整數（依實作需求）

## 元件與介面

### 1. 共用型別定義

#### Result 型別

用於驗證函式的回傳值，提供型別安全的錯誤處理。

```typescript
type Result<T, E = string> = 
  | { success: true; data: T }
  | { success: false; error: E };
```

#### 列舉型別

```typescript
// 記錄來源
type RecordSource = 'preset' | 'custom';

// 成就類型
type AchievementType = 
  | 'daily_goal'
  | 'streak_milestone'
  | 'perfect_week'
  | 'volume_milestone';

// 解鎖條件類型
type ConditionType = 
  | 'daily_goal_count'
  | 'streak_days'
  | 'perfect_week_count'
  | 'total_volume';
```

### 2. User Profile（使用者檔案）

#### 介面定義

```typescript
interface UserProfile {
  readonly userId: string;
  dailyGoal: number;
  activityPeriod: ActivityPeriod;
  reminderPreference: ReminderPreference;
  level: number;
  experiencePoints: number;
  readonly createdAt: string;
  updatedAt: string;
}

interface ActivityPeriod {
  startTime: string; // HH:mm 格式
  endTime: string;   // HH:mm 格式
}

interface ReminderPreference {
  enabled: boolean;
  frequencyMinutes: number;
}
```

#### 驗證規則

- `dailyGoal`: 500 ≤ value ≤ 10000
- `activityPeriod.endTime` > `activityPeriod.startTime`
- `activityPeriod` 時間格式：24 小時制 (00:00 - 23:59)
- `level`: value ≥ 0
- `experiencePoints`: value ≥ 0
- `reminderPreference.frequencyMinutes`: value > 0

#### 驗證函式

```typescript
function validateUserProfile(profile: Partial<UserProfile>): Result<UserProfile> {
  // 驗證每日目標
  if (profile.dailyGoal < 500 || profile.dailyGoal > 10000) {
    return { success: false, error: '每日目標必須介於 500 至 10000 毫升之間' };
  }
  
  // 驗證活動時段
  if (!isValidTimeFormat(profile.activityPeriod.startTime) || 
      !isValidTimeFormat(profile.activityPeriod.endTime)) {
    return { success: false, error: '時間格式必須為 HH:mm' };
  }
  
  if (profile.activityPeriod.endTime <= profile.activityPeriod.startTime) {
    return { success: false, error: '結束時間必須晚於開始時間' };
  }
  
  // 驗證等級與經驗值
  if (profile.level < 0 || profile.experiencePoints < 0) {
    return { success: false, error: '等級與經驗值必須為非負整數' };
  }
  
  return { success: true, data: profile as UserProfile };
}
```

### 3. Water Record（飲水記錄）

#### 介面定義

```typescript
interface WaterRecord {
  readonly recordId: string;
  readonly userId: string;
  volume: number;
  recordSource: RecordSource;
  readonly timestamp: string; // ISO 8601 格式
}
```

#### 驗證規則

- `volume`: 1 ≤ value ≤ 10000
- `recordSource`: 必須為 'preset' 或 'custom'
- `timestamp`: ISO 8601 格式，包含時區資訊
- `userId`: 必須對應有效的 User Profile

#### 驗證函式

```typescript
function validateWaterRecord(record: Partial<WaterRecord>): Result<WaterRecord> {
  // 驗證水量
  if (record.volume < 1 || record.volume > 10000) {
    return { success: false, error: '水量必須介於 1 至 10000 毫升之間' };
  }
  
  // 驗證記錄來源
  if (record.recordSource !== 'preset' && record.recordSource !== 'custom') {
    return { success: false, error: '記錄來源必須為 preset 或 custom' };
  }
  
  // 驗證時間戳記格式
  if (!isValidISO8601(record.timestamp)) {
    return { success: false, error: '時間戳記必須為 ISO 8601 格式' };
  }
  
  return { success: true, data: record as WaterRecord };
}
```

### 4. Daily Progress（每日進度）

#### 介面定義

```typescript
interface DailyProgress {
  readonly progressId: string;
  readonly userId: string;
  readonly date: string; // YYYY-MM-DD 格式
  goalVolume: number;
  completedVolume: number;
  completionPercentage: number;
  isGoalAchieved: boolean;
  readonly createdAt: string;
  updatedAt: string;
}
```

#### 計算邏輯

```typescript
function calculateDailyProgress(
  userId: string,
  date: string,
  goalVolume: number,
  waterRecords: WaterRecord[]
): DailyProgress {
  // 彙總當日所有飲水記錄
  const completedVolume = waterRecords
    .filter(record => 
      record.userId === userId && 
      extractDate(record.timestamp) === date
    )
    .reduce((sum, record) => sum + record.volume, 0);
  
  // 計算完成百分比
  const completionPercentage = Math.round(
    (completedVolume / goalVolume) * 100
  );
  
  // 判斷是否達標
  const isGoalAchieved = completionPercentage >= 100;
  
  return {
    progressId: generateId(),
    userId,
    date,
    goalVolume,
    completedVolume,
    completionPercentage,
    isGoalAchieved,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
```

#### 驗證規則

- `date`: YYYY-MM-DD 格式
- `goalVolume`: value > 0
- `completedVolume`: value ≥ 0
- `completionPercentage`: 0 ≤ value ≤ 999 (允許超過 100%)
- `isGoalAchieved`: completionPercentage >= 100 時為 true

### 5. Achievement（成就）

#### 介面定義

```typescript
interface AchievementDefinition {
  readonly achievementId: string;
  type: AchievementType;
  name: string;
  description: string;
  badgeIcon: string; // 圖示檔案路徑或 URL
  unlockCondition: UnlockCondition;
}

interface UnlockCondition {
  conditionType: ConditionType;
  requiredValue: number;
}

interface UserAchievement {
  readonly userAchievementId: string;
  readonly userId: string;
  readonly achievementId: string;
  readonly unlockedAt: string; // ISO 8601 格式
}
```

#### 成就範例

```typescript
const achievementDefinitions: AchievementDefinition[] = [
  {
    achievementId: 'ach_001',
    type: 'daily_goal',
    name: '首次達標',
    description: '完成第一次每日目標',
    badgeIcon: '/badges/first_goal.png',
    unlockCondition: {
      conditionType: 'daily_goal_count',
      requiredValue: 1
    }
  },
  {
    achievementId: 'ach_002',
    type: 'streak_milestone',
    name: '七日連勝',
    description: '連續七天達成目標',
    badgeIcon: '/badges/seven_days.png',
    unlockCondition: {
      conditionType: 'streak_days',
      requiredValue: 7
    }
  },
  {
    achievementId: 'ach_003',
    type: 'perfect_week',
    name: '完美週',
    description: '一週內每天都達標',
    badgeIcon: '/badges/perfect_week.png',
    unlockCondition: {
      conditionType: 'perfect_week_count',
      requiredValue: 1
    }
  },
  {
    achievementId: 'ach_004',
    type: 'volume_milestone',
    name: '百公升達人',
    description: '累積飲水量達 100 公升',
    badgeIcon: '/badges/100_liters.png',
    unlockCondition: {
      conditionType: 'total_volume',
      requiredValue: 100000 // 毫升
    }
  }
];
```

#### 解鎖邏輯

```typescript
function checkAchievementUnlock(
  userId: string,
  achievementDef: AchievementDefinition,
  userStats: UserStatistics,
  existingAchievements: UserAchievement[]
): Result<UserAchievement | null> {
  // 檢查是否已解鎖
  const alreadyUnlocked = existingAchievements.some(
    ua => ua.userId === userId && ua.achievementId === achievementDef.achievementId
  );
  
  if (alreadyUnlocked) {
    return { success: true, data: null };
  }
  
  // 檢查解鎖條件
  const condition = achievementDef.unlockCondition;
  let conditionMet = false;
  
  switch (condition.conditionType) {
    case 'daily_goal_count':
      conditionMet = userStats.totalGoalsAchieved >= condition.requiredValue;
      break;
    case 'streak_days':
      conditionMet = userStats.currentStreak >= condition.requiredValue;
      break;
    case 'perfect_week_count':
      conditionMet = userStats.perfectWeeks >= condition.requiredValue;
      break;
    case 'total_volume':
      conditionMet = userStats.totalVolume >= condition.requiredValue;
      break;
  }
  
  if (conditionMet) {
    const userAchievement: UserAchievement = {
      userAchievementId: generateId(),
      userId,
      achievementId: achievementDef.achievementId,
      unlockedAt: new Date().toISOString()
    };
    return { success: true, data: userAchievement };
  }
  
  return { success: true, data: null };
}
```

### 6. Streak（連續紀錄）

#### 介面定義

```typescript
interface Streak {
  readonly streakId: string;
  readonly userId: string;
  currentStreak: number;
  bestStreak: number;
  streakStartDate: string; // YYYY-MM-DD 格式
  lastUpdatedDate: string; // YYYY-MM-DD 格式
  updatedAt: string; // ISO 8601 格式
}
```

#### 更新邏輯

```typescript
function updateStreak(
  streak: Streak,
  dailyProgress: DailyProgress
): Streak {
  const today = dailyProgress.date;
  const yesterday = subtractDays(today, 1);
  
  // 如果今天已達標
  if (dailyProgress.isGoalAchieved) {
    // 檢查是否為連續天數
    if (streak.lastUpdatedDate === yesterday) {
      // 連續達標，增加計數
      const newCurrentStreak = streak.currentStreak + 1;
      const newBestStreak = Math.max(newCurrentStreak, streak.bestStreak);
      
      return {
        ...streak,
        currentStreak: newCurrentStreak,
        bestStreak: newBestStreak,
        lastUpdatedDate: today,
        updatedAt: new Date().toISOString()
      };
    } else if (streak.lastUpdatedDate === today) {
      // 今天已更新過，不重複計算
      return streak;
    } else {
      // 中斷後重新開始
      return {
        ...streak,
        currentStreak: 1,
        streakStartDate: today,
        lastUpdatedDate: today,
        updatedAt: new Date().toISOString()
      };
    }
  } else {
    // 今天未達標，檢查是否需要重置
    if (streak.lastUpdatedDate === yesterday) {
      // 連續中斷，重置計數
      return {
        ...streak,
        currentStreak: 0,
        lastUpdatedDate: today,
        updatedAt: new Date().toISOString()
      };
    }
    // 已經中斷過，保持現狀
    return streak;
  }
}
```

#### 驗證規則

- `currentStreak`: value ≥ 0
- `bestStreak`: value ≥ currentStreak
- `streakStartDate`: YYYY-MM-DD 格式
- `lastUpdatedDate`: YYYY-MM-DD 格式，不可早於 streakStartDate

## 資料模型

### 實體關聯圖 (ERD)

```
┌─────────────────────────────────────────────────────────┐
│                     UserProfile                         │
├─────────────────────────────────────────────────────────┤
│ PK  userId: string                                      │
│     dailyGoal: number                                   │
│     activityPeriod: ActivityPeriod                      │
│     reminderPreference: ReminderPreference              │
│     level: number                                       │
│     experiencePoints: number                            │
│     createdAt: string                                   │
│     updatedAt: string                                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ 1:N
                   │
┌──────────────────▼──────────────────────────────────────┐
│                   WaterRecord                           │
├─────────────────────────────────────────────────────────┤
│ PK  recordId: string                                    │
│ FK  userId: string                                      │
│     volume: number                                      │
│     recordSource: RecordSource                          │
│     timestamp: string                                   │
└─────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────────────────────────┐
│                  │                                      │
│ 1:N              │ 1:1                                  │
│                  │                                      │
┌──────────────────▼──────────────────────────────────────┐
│                  DailyProgress                          │
├─────────────────────────────────────────────────────────┤
│ PK  progressId: string                                  │
│ FK  userId: string                                      │
│     date: string                                        │
│     goalVolume: number                                  │
│     completedVolume: number                             │
│     completionPercentage: number                        │
│     isGoalAchieved: boolean                             │
│     createdAt: string                                   │
│     updatedAt: string                                   │
└─────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────────────────────────┐
│                  │                                      │
│ 1:1              │ N:M                                  │
│                  │                                      │
┌──────────────────▼──────────────────────────────────────┐
│                     Streak                              │
├─────────────────────────────────────────────────────────┤
│ PK  streakId: string                                    │
│ FK  userId: string                                      │
│     currentStreak: number                               │
│     bestStreak: number                                  │
│     streakStartDate: string                             │
│     lastUpdatedDate: string                             │
│     updatedAt: string                                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              AchievementDefinition                      │
├─────────────────────────────────────────────────────────┤
│ PK  achievementId: string                               │
│     type: AchievementType                               │
│     name: string                                        │
│     description: string                                 │
│     badgeIcon: string                                   │
│     unlockCondition: UnlockCondition                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ N:M
                   │
┌──────────────────▼──────────────────────────────────────┐
│                 UserAchievement                         │
├─────────────────────────────────────────────────────────┤
│ PK  userAchievementId: string                           │
│ FK  userId: string                                      │
│ FK  achievementId: string                               │
│     unlockedAt: string                                  │
└─────────────────────────────────────────────────────────┘
```

### 資料關聯說明

1. **UserProfile ↔ WaterRecord**: 一對多關係
   - 一個使用者可以有多筆飲水記錄
   - 每筆飲水記錄屬於一個使用者

2. **UserProfile ↔ DailyProgress**: 一對多關係
   - 一個使用者可以有多個每日進度記錄
   - 每個每日進度屬於一個使用者

3. **UserProfile ↔ Streak**: 一對一關係
   - 一個使用者有一個連續紀錄
   - 每個連續紀錄屬於一個使用者

4. **UserProfile ↔ Achievement**: 多對多關係
   - 一個使用者可以解鎖多個成就
   - 一個成就可以被多個使用者解鎖
   - 透過 UserAchievement 中介表實現

## 錯誤處理

### 錯誤類型定義

```typescript
enum ValidationErrorCode {
  INVALID_RANGE = 'INVALID_RANGE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_RELATIONSHIP = 'INVALID_RELATIONSHIP',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  MISSING_REQUIRED = 'MISSING_REQUIRED'
}

interface ValidationError {
  code: ValidationErrorCode;
  field: string;
  message: string;
  details?: unknown;
}
```

### 錯誤處理策略

1. **輸入驗證錯誤**
   - 在資料寫入前進行驗證
   - 回傳詳細的錯誤訊息與欄位資訊
   - 不允許無效資料進入系統

2. **關聯完整性錯誤**
   - 檢查外鍵參照的有效性
   - 防止孤立記錄的產生
   - 提供清晰的錯誤訊息

3. **業務邏輯錯誤**
   - 檢查業務規則（如重複解鎖成就）
   - 提供友善的使用者訊息
   - 記錄錯誤以供除錯

### 錯誤處理範例

```typescript
function createWaterRecord(
  record: Partial<WaterRecord>,
  userExists: (userId: string) => boolean
): Result<WaterRecord, ValidationError> {
  // 驗證使用者存在
  if (!userExists(record.userId)) {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.INVALID_RELATIONSHIP,
        field: 'userId',
        message: '使用者不存在'
      }
    };
  }
  
  // 驗證記錄資料
  const validationResult = validateWaterRecord(record);
  if (!validationResult.success) {
    return {
      success: false,
      error: {
        code: ValidationErrorCode.INVALID_RANGE,
        field: 'volume',
        message: validationResult.error
      }
    };
  }
  
  return { success: true, data: validationResult.data };
}
```

## 測試策略

### 單元測試

針對每個資料模型的驗證函式進行測試：

1. **邊界值測試**
   - 測試最小值、最大值、邊界外的值
   - 例：dailyGoal = 499, 500, 10000, 10001

2. **格式驗證測試**
   - 測試各種有效與無效的格式
   - 例：時間格式、日期格式、ISO 8601 格式

3. **業務邏輯測試**
   - 測試計算邏輯的正確性
   - 例：完成百分比計算、連續天數更新

### 整合測試

測試資料模型之間的互動：

1. **關聯完整性測試**
   - 測試外鍵參照的有效性
   - 測試級聯操作（如刪除使用者時的相關資料處理）

2. **業務流程測試**
   - 測試完整的使用者旅程
   - 例：記錄飲水 → 更新進度 → 檢查成就 → 更新連續紀錄

### 測試資料範例

```typescript
const testUserProfile: UserProfile = {
  userId: 'user_001',
  dailyGoal: 2100,
  activityPeriod: {
    startTime: '09:00',
    endTime: '18:00'
  },
  reminderPreference: {
    enabled: true,
    frequencyMinutes: 60
  },
  level: 5,
  experiencePoints: 1250,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-15T10:30:00Z'
};

const testWaterRecords: WaterRecord[] = [
  {
    recordId: 'rec_001',
    userId: 'user_001',
    volume: 250,
    recordSource: 'preset',
    timestamp: '2025-01-15T09:30:00Z'
  },
  {
    recordId: 'rec_002',
    userId: 'user_001',
    volume: 500,
    recordSource: 'preset',
    timestamp: '2025-01-15T12:00:00Z'
  }
];
```

## 效能考量

### 資料存取最佳化

1. **索引策略**
   - 在 `userId` 欄位建立索引（所有表）
   - 在 `date` 欄位建立索引（DailyProgress）
   - 在 `timestamp` 欄位建立索引（WaterRecord）
   - 複合索引：(userId, date) 用於查詢特定使用者的每日進度

2. **查詢最佳化**
   - 使用批次查詢減少資料庫往返次數
   - 實作分頁機制處理大量歷史記錄
   - 快取常用資料（如成就定義）

3. **資料彙總**
   - 預先計算每日進度，避免即時彙總
   - 定期更新統計資料（如總飲水量）
   - 使用增量更新而非完整重算

### 記憶體管理

1. **資料結構大小**
   - UserProfile: ~200 bytes
   - WaterRecord: ~100 bytes
   - DailyProgress: ~150 bytes
   - Achievement: ~50 bytes
   - Streak: ~100 bytes

2. **批次處理**
   - 限制單次查詢的記錄數量
   - 使用串流處理大量資料
   - 實作資料分頁與懶載入

## 安全性考量

### 資料驗證

1. **輸入清理**
   - 驗證所有使用者輸入
   - 防止 SQL 注入（使用參數化查詢）
   - 限制字串長度與數值範圍

2. **型別安全**
   - 使用 TypeScript 嚴格模式
   - 避免使用 `any` 型別
   - 實作執行時期型別檢查

### 資料隱私

1. **存取控制**
   - 確保使用者只能存取自己的資料
   - 實作基於角色的存取控制（RBAC）
   - 記錄敏感操作的稽核日誌

2. **資料加密**
   - 傳輸時使用 HTTPS
   - 敏感資料加密儲存（如需要）
   - 安全的識別碼生成機制

## 未來擴展性

### 可能的擴展方向

1. **社交功能**
   - 好友系統
   - 排行榜
   - 團隊挑戰

2. **進階統計**
   - 飲水模式分析
   - 健康建議
   - 預測性提醒

3. **整合功能**
   - 健康裝置整合
   - 日曆同步
   - 第三方應用整合

### 架構擴展考量

1. **模組化設計**
   - 核心模型與擴展功能分離
   - 使用介面定義契約
   - 支援插件式架構

2. **版本管理**
   - 資料模型版本控制
   - 向後相容性策略
   - 遷移腳本管理

3. **多平台支援**
   - Web、iOS、Android 共用型別定義
   - 跨平台資料同步
   - 離線優先設計
