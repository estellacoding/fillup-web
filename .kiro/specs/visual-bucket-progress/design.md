# 設計文件

## 概述

視覺化水桶進度功能是 FillUp! 應用程式的核心視覺元件，透過直覺的水桶隱喻和流暢的動畫效果，將飲水追蹤轉化為引人入勝的互動體驗。設計重點在於提供即時視覺回饋、保持效能最佳化，並確保在各種裝置和主題下的一致性體驗。

## 架構

### 元件層次結構

```
BucketProgressContainer
├── BucketVisualization
│   ├── BucketSVG (靜態水桶外框)
│   ├── WaterFill (動態水位填充)
│   ├── ScaleMarkers (刻度標記)
│   └── RippleEffect (水波紋動畫)
├── ProgressIndicators
│   ├── PercentageDisplay (百分比顯示)
│   ├── VolumeDisplay (容量顯示)
│   └── RemainingDisplay (剩餘量顯示)
├── InteractionLayer
│   ├── TapHandler (點擊處理)
│   ├── SwipeHandler (滑動處理)
│   └── DetailModal (詳細資訊彈窗)
└── AnimationController
    ├── FillAnimation (填充動畫)
    ├── CelebrationAnimation (慶祝動畫)
    └── ThemeTransition (主題轉換動畫)
```

### 狀態管理架構

```typescript
interface BucketProgressState {
  currentVolume: number;
  targetVolume: number;
  isAnimating: boolean;
  theme: 'light' | 'dark';
  showDetails: boolean;
  celebrationTriggered: boolean;
}
```

## 元件和介面

### 1. BucketVisualization 元件

**職責：** 渲染主要的水桶視覺化和水位動畫

**關鍵特性：**
- SVG 基礎的可縮放水桶圖形
- CSS/Canvas 混合的水位填充動畫
- 響應式設計適應不同螢幕尺寸
- 硬體加速的動畫效能

**介面設計：**
```typescript
interface BucketVisualizationProps {
  currentVolume: number;
  targetVolume: number;
  theme: ThemeMode;
  onAnimationComplete: () => void;
  animationDuration: number;
}
```

### 2. WaterFill 動畫系統

**技術實作：**
- 使用 CSS `clip-path` 或 Canvas 2D API 實現水位填充
- 貝塞爾曲線模擬自然水面波動
- 分層動畫：底層填充 + 表面波紋
- 60fps 目標幀率，使用 `requestAnimationFrame`

**動畫時序：**
```
填充動畫流程：
1. 初始狀態 (0ms)
2. 加速階段 (0-100ms) - ease-out
3. 主要填充 (100-400ms) - linear
4. 減速完成 (400-500ms) - ease-in
5. 波紋穩定 (500-800ms)
```

### 3. ScaleMarkers 刻度系統

**設計規格：**
- 主要刻度：每 500ml 顯示數值標籤
- 次要刻度：每 250ml 顯示短線
- 動態顯示：根據目標容量調整刻度範圍
- 響應式字體：12-16px 根據螢幕尺寸調整

### 4. ProgressIndicators 資訊顯示

**佈局設計：**
```
┌─────────────────────────┐
│     85%                 │  ← 大型百分比 (48px)
│  1700ml / 2000ml       │  ← 容量資訊 (24px)
│   還需 300ml           │  ← 剩餘提示 (18px)
└─────────────────────────┘
```

**字體層次：**
- 百分比：48px, 粗體, 主要色彩
- 容量：24px, 中等, 次要色彩  
- 剩餘：18px, 一般, 提示色彩

### 5. CelebrationAnimation 慶祝效果

**動畫元素：**
- 粒子系統：20-30 個彩色圓點
- 運動軌跡：拋物線 + 重力效果
- 色彩變化：漸變透明度 (1.0 → 0.0)
- 持續時間：2.5 秒總長度

**效能最佳化：**
- 使用 CSS `transform` 和 `opacity` 屬性
- 避免觸發重排 (reflow)
- 動畫結束後清理 DOM 元素

## 資料模型

### WaterProgress 資料結構

```typescript
interface WaterProgress {
  id: string;
  date: Date;
  entries: WaterEntry[];
  targetVolume: number;
  currentVolume: number;
  completionPercentage: number;
  isGoalAchieved: boolean;
  achievedAt?: Date;
}

interface WaterEntry {
  id: string;
  timestamp: Date;
  volume: number;
  source: 'manual' | 'preset';
}

interface AnimationConfig {
  fillDuration: number;
  rippleDuration: number;
  celebrationDuration: number;
  easing: string;
}
```

### 主題配置

```typescript
interface ThemeConfig {
  bucket: {
    strokeColor: string;
    fillColor: string;
    backgroundColor: string;
  };
  water: {
    primaryColor: string;
    secondaryColor: string;
    rippleColor: string;
  };
  text: {
    primaryColor: string;
    secondaryColor: string;
    hintColor: string;
  };
  celebration: {
    particleColors: string[];
  };
}
```

## 錯誤處理

### 動畫錯誤處理

1. **效能降級策略：**
   - 檢測裝置效能能力
   - 低效能裝置禁用複雜動畫
   - 提供簡化版本的視覺回饋

2. **動畫中斷處理：**
   - 使用者快速連續操作時的狀態同步
   - 動畫隊列管理避免衝突
   - 緊急停止機制

3. **資料同步錯誤：**
   - 本地狀態與後端不一致時的恢復機制
   - 離線模式下的資料暫存
   - 網路恢復後的資料同步

### 使用者體驗錯誤處理

```typescript
interface ErrorState {
  type: 'animation' | 'data' | 'performance';
  message: string;
  fallbackAction: () => void;
}

// 錯誤處理策略
const errorHandlers = {
  animationFailure: () => showStaticProgress(),
  dataLoadFailure: () => showCachedData(),
  performanceIssue: () => enableLowPowerMode()
};
```

## 測試策略

### 1. 單元測試

**測試範圍：**
- 水位計算邏輯準確性
- 動畫時序控制
- 主題切換功能
- 資料狀態管理

**測試工具：** Vitest + Testing Library

### 2. 視覺回歸測試

**測試項目：**
- 不同水位的視覺渲染
- 主題切換的視覺一致性
- 動畫關鍵幀截圖比對
- 響應式佈局驗證

**測試工具：** Playwright + Percy

### 3. 效能測試

**測試指標：**
- 動畫幀率監控 (目標 60fps)
- 記憶體使用量追蹤
- CPU 使用率測量
- 電池消耗評估

**測試環境：**
- 高階裝置 (iPhone 14 Pro, Pixel 7)
- 中階裝置 (iPhone SE, Pixel 6a)  
- 低階裝置 (模擬器限制 CPU)

### 4. 使用者互動測試

**測試場景：**
- 快速連續點擊處理
- 長按和滑動手勢
- 多點觸控意外輸入
- 螢幕旋轉適應性

### 5. 無障礙測試

**測試項目：**
- 色彩對比度驗證 (WCAG 2.1 AA)
- 螢幕閱讀器相容性
- 鍵盤導航支援
- 動畫偏好設定尊重

## 效能最佳化策略

### 1. 渲染最佳化

- **虛擬化技術：** 只渲染可見區域的動畫元素
- **批次更新：** 合併多個狀態更新為單次渲染
- **硬體加速：** 使用 `transform3d` 觸發 GPU 加速
- **記憶體管理：** 及時清理動畫監聽器和定時器

### 2. 動畫最佳化

- **預載入：** 關鍵動畫資源預先載入
- **分層渲染：** 靜態元素與動態元素分離
- **適應性品質：** 根據裝置能力調整動畫複雜度
- **暫停機制：** 應用程式背景時暫停動畫

### 3. 資料最佳化

- **本地快取：** 使用 IndexedDB 快取歷史資料
- **增量更新：** 只同步變更的資料部分
- **壓縮儲存：** 歷史資料壓縮儲存
- **清理策略：** 定期清理過期的快取資料

這個設計確保了視覺化水桶進度功能既美觀又高效，同時保持了 FillUp! 應用程式「簡潔優先」的設計原則。