# 設計文件

## 概述

使用者引導系統為 FillUp! 提供流暢且非侵入式的首次使用體驗，透過模組化的引導流程幫助新使用者快速理解產品價值、完成個人化設定並學會核心功能。設計採用漸進式揭露原則，確保使用者可以隨時跳過並快速開始使用，同時提供足夠的指導來建立成功的飲水追蹤習慣。

## 架構

### 引導系統架構

```
OnboardingOrchestrator (引導協調器)
├── WelcomeFlow (歡迎流程)
│   ├── IntroSlide (產品介紹頁)
│   ├── FeaturesSlide (功能展示頁)
│   └── BenefitsSlide (價值主張頁)
├── PersonalizationSetup (個人化設定)
│   ├── WeightInput (體重輸入)
│   ├── ActivitySelector (活動量選擇)
│   └── GoalConfiguration (目標設定)
├── FeatureTour (功能導覽)
│   ├── InteractiveTutorial (互動教學)
│   ├── TooltipSystem (工具提示系統)
│   └── HelpCenter (幫助中心)
├── PermissionManager (權限管理)
│   ├── NotificationPermission (通知權限)
│   ├── CalendarIntegration (行事曆整合)
│   └── DataSync (資料同步)
└── OnboardingState (引導狀態管理)
    ├── ProgressTracker (進度追蹤)
    ├── SkipHandler (跳過處理)
    └── CompletionManager (完成管理)
```

### 狀態管理架構

```typescript
interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  userPreferences: UserPreferences;
  skipHistory: SkipRecord[];
  isFirstTime: boolean;
  canSkip: boolean;
}

enum OnboardingStep {
  WELCOME_INTRO = 'welcome_intro',
  WELCOME_FEATURES = 'welcome_features', 
  WELCOME_BENEFITS = 'welcome_benefits',
  PERSONALIZATION_WEIGHT = 'personalization_weight',
  PERSONALIZATION_ACTIVITY = 'personalization_activity',
  PERSONALIZATION_GOAL = 'personalization_goal',
  PERMISSIONS_NOTIFICATION = 'permissions_notification',
  PERMISSIONS_CALENDAR = 'permissions_calendar',
  PERMISSIONS_SYNC = 'permissions_sync',
  FEATURE_TOUR_BUCKET = 'feature_tour_bucket',
  FEATURE_TOUR_LOGGING = 'feature_tour_logging',
  FEATURE_TOUR_STATS = 'feature_tour_stats',
  COMPLETED = 'completed'
}
```

## 元件和介面

### 1. WelcomeFlow 歡迎流程

#### 設計規格
- **滑動式介面：** 三頁水平滑動，支援手勢和按鈕導航
- **視覺層次：** 大型插圖 + 標題 + 描述 + 行動按鈕
- **動畫效果：** 頁面切換使用滑動動畫，元素進入使用淡入效果
- **跳過機制：** 每頁右上角提供「跳過」按鈕

#### 頁面內容設計

**第一頁 - 產品介紹**
```
┌─────────────────────────────────────┐
│                [跳過]                │
│                                     │
│        🪣 FillUp! 圖示              │
│                                     │
│         把水裝滿！                   │
│    讓喝水變成有趣的遊戲體驗           │
│                                     │
│              [開始]                 │
│                                     │
│            ● ○ ○                   │
└─────────────────────────────────────┘
```

**第二頁 - 核心功能**
```
┌─────────────────────────────────────┐
│                [跳過]                │
│                                     │
│        🎯 水桶進度動畫              │
│                                     │
│       視覺化追蹤飲水進度             │
│    看著水桶逐漸填滿，獲得成就感       │
│                                     │
│              [繼續]                 │
│                                     │
│            ○ ● ○                   │
└─────────────────────────────────────┘
```

**第三頁 - 價值主張**
```
┌─────────────────────────────────────┐
│                [跳過]                │
│                                     │
│        📊 統計圖表插圖              │
│                                     │
│       建立健康的飲水習慣             │
│   智慧提醒 + 統計分析 + 成就系統     │
│                                     │
│            [立即開始]               │
│                                     │
│            ○ ○ ●                   │
└─────────────────────────────────────┘
```

#### 技術實作

```typescript
interface WelcomeFlowProps {
  onComplete: (skipped: boolean) => void;
  onSkip: () => void;
}

interface SlideContent {
  id: string;
  title: string;
  description: string;
  illustration: string;
  primaryAction: string;
  secondaryAction?: string;
}

const welcomeSlides: SlideContent[] = [
  {
    id: 'intro',
    title: '把水裝滿！',
    description: '讓喝水變成有趣的遊戲體驗',
    illustration: '/illustrations/fillup-hero.svg',
    primaryAction: '開始'
  },
  {
    id: 'features',
    title: '視覺化追蹤飲水進度',
    description: '看著水桶逐漸填滿，獲得成就感',
    illustration: '/illustrations/bucket-progress.svg',
    primaryAction: '繼續'
  },
  {
    id: 'benefits',
    title: '建立健康的飲水習慣',
    description: '智慧提醒 + 統計分析 + 成就系統',
    illustration: '/illustrations/health-benefits.svg',
    primaryAction: '立即開始'
  }
];
```

### 2. PersonalizationSetup 個人化設定

#### 設計流程
1. **體重輸入（選填）**
2. **活動量選擇**
3. **目標確認與調整**

#### 體重輸入介面

```typescript
interface WeightInputProps {
  onComplete: (weight?: number) => void;
  onSkip: () => void;
}
```

**介面設計：**
```
┌─────────────────────────────────────┐
│  個人化設定 (1/3)          [跳過]    │
│                                     │
│         輸入體重（選填）             │
│    幫助我們建議適合的飲水目標         │
│                                     │
│    ┌─────────────────────────┐      │
│    │        [65] kg          │      │
│    └─────────────────────────┘      │
│                                     │
│         [稍後設定]  [繼續]          │
│                                     │
│              ● ○ ○                 │
└─────────────────────────────────────┘
```

#### 活動量選擇介面

```typescript
interface ActivityLevel {
  id: 'low' | 'medium' | 'high';
  name: string;
  description: string;
  multiplier: number;
}

const activityLevels: ActivityLevel[] = [
  {
    id: 'low',
    name: '低活動量',
    description: '主要坐著工作，很少運動',
    multiplier: 1.0
  },
  {
    id: 'medium', 
    name: '中等活動量',
    description: '偶爾運動，日常活動適中',
    multiplier: 1.2
  },
  {
    id: 'high',
    name: '高活動量', 
    description: '經常運動，體力活動較多',
    multiplier: 1.5
  }
];
```

**介面設計：**
```
┌─────────────────────────────────────┐
│  個人化設定 (2/3)          [跳過]    │
│                                     │
│           選擇活動量                │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🚶 低活動量                  │    │
│  │ 主要坐著工作，很少運動        │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 🏃 中等活動量         ✓     │    │
│  │ 偶爾運動，日常活動適中        │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 💪 高活動量                  │    │
│  │ 經常運動，體力活動較多        │    │
│  └─────────────────────────────┘    │
│                                     │
│              [繼續]                 │
│              ○ ● ○                 │
└─────────────────────────────────────┘
```

#### 目標設定介面

```typescript
interface GoalCalculation {
  baseAmount: number; // 基礎建議量 (ml)
  activityMultiplier: number;
  weightFactor: number;
  recommendedGoal: number;
}

function calculateRecommendedGoal(
  weight?: number,
  activityLevel: ActivityLevel
): number {
  const baseAmount = 2000; // 基礎 2000ml
  const weightFactor = weight ? Math.max(0.8, Math.min(1.2, weight / 70)) : 1.0;
  return Math.round(baseAmount * weightFactor * activityLevel.multiplier / 100) * 100;
}
```

**介面設計：**
```
┌─────────────────────────────────────┐
│  個人化設定 (3/3)          [跳過]    │
│                                     │
│           設定每日目標              │
│        根據您的資料建議              │
│                                     │
│         建議目標：2400ml            │
│                                     │
│    ┌─────────────────────────┐      │
│    │     ─────●─────         │      │
│    │   1500ml    3000ml      │      │
│    └─────────────────────────┘      │
│                                     │
│         目前設定：2400ml            │
│                                     │
│       [使用預設]  [確認設定]        │
│              ○ ○ ●                 │
└─────────────────────────────────────┘
```

### 3. FeatureTour 功能導覽

#### 互動式教學設計

**教學覆蓋層架構：**
```typescript
interface TutorialOverlay {
  targetElement: string; // CSS 選擇器
  position: 'top' | 'bottom' | 'left' | 'right';
  title: string;
  description: string;
  actionText: string;
  canSkip: boolean;
}

interface TutorialStep {
  id: string;
  trigger: 'onMount' | 'onClick' | 'onFirstUse';
  overlay: TutorialOverlay;
  highlightArea: HighlightArea;
}
```

**水桶進度教學：**
```
┌─────────────────────────────────────┐
│                                     │
│        ┌─────────────────┐          │
│        │                 │          │
│        │    🪣 水桶      │ ←─┐      │
│        │     85%         │   │      │
│        │                 │   │      │
│        └─────────────────┘   │      │
│                              │      │
│  ┌─────────────────────────────┐    │
│  │ 這是您的飲水進度水桶         │    │
│  │ 每次記錄飲水都會看到        │    │
│  │ 水位上升的動畫效果          │    │
│  │                             │    │
│  │        [知道了]             │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

#### 工具提示系統

```typescript
interface TooltipConfig {
  element: HTMLElement;
  content: string;
  position: TooltipPosition;
  delay: number;
  persistent: boolean;
}

interface TooltipPosition {
  placement: 'top' | 'bottom' | 'left' | 'right';
  offset: { x: number; y: number };
  arrow: boolean;
}
```

**工具提示樣式：**
```css
.tooltip {
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  max-width: 200px;
  z-index: 1000;
}

.tooltip-arrow {
  width: 0;
  height: 0;
  border-style: solid;
}
```

### 4. PermissionManager 權限管理

#### 權限請求流程設計

**通知權限介面：**
```
┌─────────────────────────────────────┐
│  權限設定 (1/3)            [稍後]    │
│                                     │
│            🔔                       │
│         開啟通知提醒                │
│                                     │
│    讓 FillUp! 在適當時機提醒您      │
│         記得補充水分                │
│                                     │
│  • 智慧學習您的飲水習慣             │
│  • 尊重專注時段和睡眠時間           │
│  • 可隨時在設定中關閉               │
│                                     │
│         [拒絕]    [允許]            │
│                                     │
│              ● ○ ○                 │
└─────────────────────────────────────┘
```

**行事曆整合介面：**
```
┌─────────────────────────────────────┐
│  權限設定 (2/3)            [跳過]    │
│                                     │
│            📅                       │
│         行事曆整合（選填）           │
│                                     │
│    根據您的行程安排智慧提醒          │
│                                     │
│  • 會議期間暫停提醒                 │
│  • 空檔時間增加提醒頻率             │
│  • 完全保護您的隱私                │
│                                     │
│         [跳過]    [整合]            │
│                                     │
│              ○ ● ○                 │
└─────────────────────────────────────┘
```

**資料同步介面：**
```
┌─────────────────────────────────────┐
│  權限設定 (3/3)            [跳過]    │
│                                     │
│            ☁️                       │
│           資料同步                  │
│                                     │
│      跨裝置保存您的飲水記錄          │
│                                     │
│  • 手機和電腦資料同步               │
│  • 資料安全加密儲存                 │
│  • 可隨時停用同步功能               │
│                                     │
│         [本地儲存]  [雲端同步]       │
│                                     │
│              ○ ○ ●                 │
└─────────────────────────────────────┘
```

#### 權限狀態管理

```typescript
interface PermissionState {
  notifications: PermissionStatus;
  calendar: PermissionStatus;
  dataSync: boolean;
  requestHistory: PermissionRequest[];
}

enum PermissionStatus {
  NOT_REQUESTED = 'not_requested',
  GRANTED = 'granted', 
  DENIED = 'denied',
  SKIPPED = 'skipped'
}

interface PermissionRequest {
  type: 'notification' | 'calendar';
  requestedAt: Date;
  status: PermissionStatus;
  canRetry: boolean;
}
```

### 5. OnboardingOrchestrator 引導協調器

#### 流程控制邏輯

```typescript
class OnboardingOrchestrator {
  private state: OnboardingState;
  private stepHandlers: Map<OnboardingStep, StepHandler>;
  
  async startOnboarding(): Promise<void> {
    if (!this.state.isFirstTime) {
      return this.showReturningUserFlow();
    }
    
    await this.executeStep(OnboardingStep.WELCOME_INTRO);
  }
  
  async executeStep(step: OnboardingStep): Promise<void> {
    const handler = this.stepHandlers.get(step);
    if (!handler) {
      throw new Error(`No handler for step: ${step}`);
    }
    
    try {
      const result = await handler.execute();
      await this.handleStepResult(step, result);
    } catch (error) {
      await this.handleStepError(step, error);
    }
  }
  
  async handleSkip(step: OnboardingStep): Promise<void> {
    this.recordSkip(step);
    const nextStep = this.getNextStep(step);
    
    if (nextStep) {
      await this.executeStep(nextStep);
    } else {
      await this.completeOnboarding();
    }
  }
  
  private getNextStep(currentStep: OnboardingStep): OnboardingStep | null {
    const stepSequence = [
      OnboardingStep.WELCOME_INTRO,
      OnboardingStep.WELCOME_FEATURES,
      OnboardingStep.WELCOME_BENEFITS,
      OnboardingStep.PERSONALIZATION_WEIGHT,
      OnboardingStep.PERSONALIZATION_ACTIVITY,
      OnboardingStep.PERSONALIZATION_GOAL,
      OnboardingStep.PERMISSIONS_NOTIFICATION,
      OnboardingStep.PERMISSIONS_CALENDAR,
      OnboardingStep.PERMISSIONS_SYNC
    ];
    
    const currentIndex = stepSequence.indexOf(currentStep);
    return currentIndex < stepSequence.length - 1 
      ? stepSequence[currentIndex + 1] 
      : null;
  }
}
```

#### 跳過處理策略

```typescript
interface SkipStrategy {
  step: OnboardingStep;
  defaultValues: any;
  canRetry: boolean;
  retryConditions?: string[];
}

const skipStrategies: SkipStrategy[] = [
  {
    step: OnboardingStep.PERSONALIZATION_WEIGHT,
    defaultValues: { weight: null },
    canRetry: true,
    retryConditions: ['settings_page', 'goal_adjustment']
  },
  {
    step: OnboardingStep.PERSONALIZATION_GOAL,
    defaultValues: { dailyGoal: 2000 },
    canRetry: true,
    retryConditions: ['settings_page']
  },
  {
    step: OnboardingStep.PERMISSIONS_NOTIFICATION,
    defaultValues: { notifications: false },
    canRetry: true,
    retryConditions: ['settings_page', 'first_reminder']
  }
];
```

## 資料模型

### OnboardingProgress 資料結構

```typescript
interface OnboardingProgress {
  userId: string;
  isCompleted: boolean;
  completedSteps: OnboardingStep[];
  skippedSteps: OnboardingStep[];
  currentStep?: OnboardingStep;
  startedAt: Date;
  completedAt?: Date;
  version: string; // 引導版本號
}

interface UserPreferences {
  weight?: number;
  activityLevel: ActivityLevel;
  dailyGoal: number;
  notifications: NotificationPreference;
  calendarIntegration: boolean;
  dataSync: boolean;
}

interface NotificationPreference {
  enabled: boolean;
  frequency: number; // 分鐘
  quietHours: {
    start: string; // HH:mm
    end: string;   // HH:mm
  };
  weekendsEnabled: boolean;
}
```

### 引導分析資料

```typescript
interface OnboardingAnalytics {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  completionRate: number; // 0-1
  stepTimings: StepTiming[];
  skipReasons: SkipReason[];
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

interface StepTiming {
  step: OnboardingStep;
  startTime: Date;
  endTime: Date;
  duration: number; // 毫秒
  interactions: number;
}

interface SkipReason {
  step: OnboardingStep;
  reason: 'user_skip' | 'timeout' | 'error';
  timestamp: Date;
}
```

## 錯誤處理

### 引導流程錯誤處理

1. **網路連線錯誤**
   - 離線模式下的本地引導
   - 資料同步延遲處理
   - 優雅降級到基本功能

2. **權限請求失敗**
   - 系統拒絕權限的處理
   - 替代方案提供
   - 稍後重試機制

3. **資料驗證錯誤**
   - 使用者輸入驗證
   - 預設值回退策略
   - 錯誤訊息友善化

### 錯誤恢復策略

```typescript
interface ErrorRecoveryStrategy {
  errorType: string;
  retryAttempts: number;
  fallbackAction: () => void;
  userMessage: string;
}

const errorStrategies: ErrorRecoveryStrategy[] = [
  {
    errorType: 'network_error',
    retryAttempts: 3,
    fallbackAction: () => enableOfflineMode(),
    userMessage: '網路連線不穩定，已切換到離線模式'
  },
  {
    errorType: 'permission_denied',
    retryAttempts: 1,
    fallbackAction: () => showAlternativeOptions(),
    userMessage: '權限被拒絕，您可以稍後在設定中開啟'
  },
  {
    errorType: 'validation_error',
    retryAttempts: 0,
    fallbackAction: () => useDefaultValues(),
    userMessage: '使用預設設定繼續'
  }
];
```

## 測試策略

### 1. 使用者體驗測試

**測試場景：**
- 完整引導流程測試
- 各種跳過組合測試
- 中斷後恢復測試
- 不同裝置尺寸適應性

**測試工具：** Playwright + 自動化腳本

### 2. 效能測試

**測試指標：**
- 引導頁面載入時間
- 動畫流暢度
- 記憶體使用量
- 電池消耗

**測試環境：**
- 各種網路條件 (3G, 4G, WiFi)
- 不同裝置效能等級
- 多種作業系統版本

### 3. 無障礙測試

**測試項目：**
- 螢幕閱讀器相容性
- 鍵盤導航完整性
- 色彩對比度驗證
- 字體大小適應性

### 4. A/B 測試

**測試變數：**
- 引導步驟數量
- 跳過按鈕位置
- 文案內容變化
- 視覺設計風格

**成功指標：**
- 引導完成率
- 功能採用率
- 使用者留存率
- 目標設定準確性

## 效能最佳化

### 1. 載入最佳化

- **懶載入：** 非當前步驟的資源延遲載入
- **預載入：** 下一步驟資源預先載入
- **快取策略：** 插圖和動畫資源快取
- **壓縮：** 圖片和動畫檔案最佳化

### 2. 動畫最佳化

- **硬體加速：** 使用 CSS transform 和 opacity
- **幀率控制：** 維持 60fps 目標
- **記憶體管理：** 及時清理動畫監聽器
- **適應性品質：** 根據裝置能力調整動畫複雜度

### 3. 資料最佳化

- **本地儲存：** 引導進度本地快取
- **增量同步：** 只同步變更的設定
- **壓縮傳輸：** 使用 gzip 壓縮 API 回應
- **批次處理：** 合併多個 API 請求

這個設計確保了使用者引導系統既全面又靈活，能夠適應不同使用者的需求和偏好，同時保持 FillUp! 應用程式「簡潔優先」和「尊重使用者」的核心原則。