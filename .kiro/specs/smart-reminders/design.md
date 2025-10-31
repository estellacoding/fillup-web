# 智慧提醒系統設計文件

## 概述

智慧提醒系統是 FillUp! 的核心功能之一，旨在透過學習使用者行為模式，提供個人化、非干擾性的飲水提醒。系統採用模組化架構，支援多種提醒方式、智慧學習機制，並整合天氣與行事曆資料以提供最佳的使用者體驗。

## 架構

### 系統架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                    智慧提醒系統                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   提醒管理器     │  │   學習引擎       │  │   通知服務       │ │
│  │ ReminderManager │  │ LearningEngine  │  │NotificationSvc  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   設定管理器     │  │   專注模式       │  │   排程器         │ │
│  │SettingsManager  │  │  FocusMode      │  │   Scheduler     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   資料儲存       │  │   外部整合       │  │   分析引擎       │ │
│  │  DataStorage    │  │ExternalIntegration│ │AnalyticsEngine │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 核心元件

#### 1. 提醒管理器 (ReminderManager)
- **職責**: 統籌所有提醒相關功能的核心控制器
- **功能**: 
  - 管理提醒排程與執行
  - 協調各子系統間的互動
  - 處理提醒狀態變更
- **介面**: 
  - `scheduleReminder(config: ReminderConfig): void`
  - `cancelReminder(id: string): void`
  - `updateReminderFrequency(frequency: number): void`

#### 2. 學習引擎 (LearningEngine)
- **職責**: 分析使用者行為並最佳化提醒策略
- **功能**:
  - 追蹤使用者回應模式
  - 計算最佳提醒時機
  - 調整提醒頻率與內容
- **演算法**: 
  - 基於成功率的強化學習
  - 時間序列分析
  - 模式識別與預測

#### 3. 通知服務 (NotificationService)
- **職責**: 處理所有通知的傳送與樣式
- **功能**:
  - 多種通知類型支援
  - 訊息個人化
  - 通知歷史記錄
- **通知類型**:
  - 標準推播通知
  - 靜音視覺通知
  - 震動提醒

## 元件與介面

### 核心資料模型

```typescript
// 提醒設定介面
interface ReminderSettings {
  frequency: number; // 1-4 小時
  activityPeriod: {
    start: string; // HH:mm 格式
    end: string;   // HH:mm 格式
  };
  weekendMode: {
    enabled: boolean;
    frequency: number;
    activityPeriod: {
      start: string;
      end: string;
    };
  };
  notificationStyle: 'standard' | 'silent' | 'vibration';
  weatherAdjustment: boolean;
  calendarIntegration: boolean;
}

// 學習資料模型
interface LearningData {
  userId: string;
  responseHistory: ResponseRecord[];
  optimalTimes: number[]; // 一天中的最佳時間（小時）
  successRate: number;
  lastUpdated: Date;
  weekendPatterns?: ResponseRecord[];
}

// 回應記錄
interface ResponseRecord {
  timestamp: Date;
  reminderSent: Date;
  responded: boolean;
  responseTime?: number; // 分鐘
  dayOfWeek: number;
  hour: number;
  weatherCondition?: string;
}

// 專注模式狀態
interface FocusMode {
  isActive: boolean;
  startTime?: Date;
  duration: number; // 分鐘
  autoActivation: {
    calendarEvents: boolean;
    manualTriggers: string[]; // 自訂觸發條件
  };
}
```

### 服務介面

```typescript
// 提醒管理器介面
interface IReminderManager {
  initialize(settings: ReminderSettings): Promise<void>;
  scheduleNextReminder(): Promise<void>;
  handleUserResponse(responded: boolean): Promise<void>;
  updateSettings(settings: Partial<ReminderSettings>): Promise<void>;
  pauseReminders(duration: number): Promise<void>;
  resumeReminders(): Promise<void>;
}

// 學習引擎介面
interface ILearningEngine {
  analyzeUserBehavior(data: ResponseRecord[]): Promise<LearningInsights>;
  getOptimalReminderTime(): Promise<Date>;
  updateLearningData(record: ResponseRecord): Promise<void>;
  calculateSuccessRate(period: number): Promise<number>;
  predictBestFrequency(): Promise<number>;
}

// 通知服務介面
interface INotificationService {
  sendReminder(message: string, style: NotificationStyle): Promise<void>;
  generateMessage(context: MessageContext): Promise<string>;
  scheduleNotification(when: Date, message: string): Promise<string>;
  cancelNotification(id: string): Promise<void>;
}
```

## 資料模型

### 使用者檔案擴充

```typescript
// 擴充現有的 UserProfile
interface UserProfileWithReminders extends UserProfile {
  reminderSettings: ReminderSettings;
  learningData: LearningData;
  focusMode: FocusMode;
  notificationHistory: NotificationRecord[];
  privacySettings: {
    dataCollection: boolean;
    calendarAccess: boolean;
    weatherAccess: boolean;
    localStorageOnly: boolean;
  };
}

// 通知記錄
interface NotificationRecord {
  id: string;
  timestamp: Date;
  message: string;
  type: 'reminder' | 'encouragement' | 'achievement';
  responded: boolean;
  responseTime?: number;
}
```

### 天氣整合資料

```typescript
interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  timestamp: Date;
  location?: string;
}

interface WeatherAdjustment {
  temperatureThresholds: {
    mild: number;    // 25°C
    hot: number;     // 30°C
  };
  adjustmentRates: {
    mild: number;    // 25% 增加
    hot: number;     // 50% 增加
  };
}
```

## 錯誤處理

### 錯誤類型定義

```typescript
enum ReminderErrorType {
  NOTIFICATION_PERMISSION_DENIED = 'NOTIFICATION_PERMISSION_DENIED',
  CALENDAR_ACCESS_DENIED = 'CALENDAR_ACCESS_DENIED',
  WEATHER_SERVICE_UNAVAILABLE = 'WEATHER_SERVICE_UNAVAILABLE',
  LEARNING_DATA_CORRUPTED = 'LEARNING_DATA_CORRUPTED',
  SCHEDULING_CONFLICT = 'SCHEDULING_CONFLICT'
}

class ReminderError extends Error {
  constructor(
    public type: ReminderErrorType,
    message: string,
    public recoverable: boolean = true
  ) {
    super(message);
  }
}
```

### 錯誤處理策略

1. **通知權限被拒絕**
   - 降級至應用內通知
   - 提供設定指引
   - 記錄降級狀態

2. **行事曆存取被拒絕**
   - 切換至手動專注模式
   - 保持其他功能正常運作
   - 提供替代方案

3. **天氣服務不可用**
   - 使用快取資料
   - 回退至標準提醒模式
   - 定期重試連接

4. **學習資料損壞**
   - 重設為預設模式
   - 開始新的學習週期
   - 保留基本設定

## 測試策略

### 單元測試

1. **提醒管理器測試**
   - 提醒排程邏輯
   - 設定更新處理
   - 狀態管理

2. **學習引擎測試**
   - 行為分析演算法
   - 最佳化計算
   - 資料完整性

3. **通知服務測試**
   - 訊息生成
   - 通知傳送
   - 樣式處理

### 整合測試

1. **端到端提醒流程**
   - 從設定到通知傳送
   - 使用者回應處理
   - 學習資料更新

2. **外部服務整合**
   - 天氣 API 整合
   - 行事曆 API 整合
   - 錯誤處理驗證

### 效能測試

1. **記憶體使用**
   - 學習資料儲存效率
   - 通知佇列管理
   - 快取策略驗證

2. **回應時間**
   - 提醒觸發延遲
   - 設定更新速度
   - 學習計算效能

## 安全性考量

### 資料保護

1. **本機儲存優先**
   - 所有學習資料預設儲存在本機
   - 雲端同步為選用功能
   - 資料加密儲存

2. **權限管理**
   - 最小權限原則
   - 明確的權限說明
   - 使用者可撤銷權限

3. **隱私設定**
   - 透明的資料使用說明
   - 細粒度的隱私控制
   - 資料匿名化選項

### API 安全

1. **天氣服務**
   - API 金鑰安全儲存
   - 請求頻率限制
   - 錯誤資訊過濾

2. **行事曆整合**
   - OAuth 2.0 認證
   - 最小範圍權限
   - 定期權杖更新

## 效能最佳化

### 記憶體管理

1. **資料快取策略**
   - LRU 快取用於學習資料
   - 天氣資料 4 小時快取
   - 通知歷史限制筆數

2. **背景處理**
   - 學習計算異步執行
   - 批次處理歷史資料
   - 智慧排程減少 CPU 使用

### 電池最佳化

1. **智慧排程**
   - 合併相近時間的任務
   - 避免頻繁喚醒
   - 使用系統排程器

2. **網路請求最佳化**
   - 天氣資料批次請求
   - 快取策略減少請求
   - 離線模式支援

## 可擴展性設計

### 模組化架構

1. **插件系統**
   - 通知提供者插件
   - 學習演算法插件
   - 外部服務整合插件

2. **配置驅動**
   - 可配置的學習參數
   - 動態調整的閾值
   - 實驗性功能開關

### 國際化支援

1. **多語言訊息**
   - 訊息模板系統
   - 文化適應的提醒時間
   - 本地化的激勵內容

2. **時區處理**
   - 自動時區偵測
   - 跨時區同步
   - 旅行模式支援

## 監控與分析

### 系統監控

1. **效能指標**
   - 提醒準確性
   - 使用者回應率
   - 系統資源使用

2. **錯誤追蹤**
   - 異常情況記錄
   - 恢復策略執行
   - 使用者影響評估

### 使用者分析

1. **行為模式**
   - 提醒效果分析
   - 使用習慣追蹤
   - 改進建議生成

2. **隱私保護分析**
   - 匿名化資料收集
   - 聚合統計資訊
   - 使用者同意管理