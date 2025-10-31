# 設計文件

## 概述

統計儀表板是 FillUp! 應用程式的核心分析模組，提供多層次的數據視覺化和洞察分析。設計採用模組化架構，支援響應式介面、即時數據更新和豐富的互動體驗。系統將原始飲水記錄轉換為有意義的統計指標和視覺化圖表，幫助使用者深入了解飲水習慣並做出改善決策。

## 架構

### 整體架構模式
採用 **分層架構 (Layered Architecture)** 結合 **模組化設計**：

```
┌─────────────────────────────────────────┐
│           展示層 (Presentation)          │
│  ┌─────────────┐ ┌─────────────────────┐ │
│  │ 圖表元件     │ │ 統計卡片元件         │ │
│  └─────────────┘ └─────────────────────┘ │
├─────────────────────────────────────────┤
│            業務邏輯層 (Business)          │
│  ┌─────────────┐ ┌─────────────────────┐ │
│  │ 分析引擎     │ │ 洞察生成器           │ │
│  └─────────────┘ └─────────────────────┘ │
├─────────────────────────────────────────┤
│            數據存取層 (Data Access)       │
│  ┌─────────────┐ ┌─────────────────────┐ │
│  │ 數據聚合器   │ │ 快取管理器           │ │
│  └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────┘
```

### 技術堆疊
- **前端框架**: React 18 with TypeScript
- **圖表庫**: Chart.js 4.x + React-Chartjs-2
- **狀態管理**: Zustand (輕量級，適合統計數據)
- **樣式系統**: Tailwind CSS + CSS Modules
- **數據處理**: date-fns (日期處理) + lodash (數據操作)
- **匯出功能**: html2canvas + jsPDF (圖片/PDF) + papaparse (CSV)

## 元件和介面

### 核心元件架構

#### 1. DashboardContainer (容器元件)
```typescript
interface DashboardContainerProps {
  userId: string;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}
```
**職責**: 統籌整個儀表板的狀態管理和數據流

#### 2. TimeRangeSelector (時間選擇器)
```typescript
interface TimeRangeSelectorProps {
  selectedRange: 'daily' | 'weekly' | 'monthly';
  onRangeChange: (range: TimeRangeType) => void;
  customDateRange?: DateRange;
}
```
**職責**: 提供時間週期切換和自訂日期範圍選擇

#### 3. MetricsOverview (指標概覽)
```typescript
interface MetricsOverviewProps {
  metrics: {
    averageDailyIntake: number;
    goalAchievementRate: number;
    longestStreak: number;
    totalVolume: number;
  };
  loading: boolean;
}
```
**職責**: 展示關鍵績效指標卡片

#### 4. ChartContainer (圖表容器)
```typescript
interface ChartContainerProps {
  chartType: 'timeline' | 'bar' | 'line' | 'heatmap';
  data: ChartData;
  options: ChartOptions;
  interactive: boolean;
}
```
**職責**: 統一的圖表渲染和互動處理

#### 5. InsightsPanel (洞察面板)
```typescript
interface InsightsPanelProps {
  insights: InsightData[];
  recommendations: Recommendation[];
  patternAnalysis: PatternAnalysis;
}
```
**職責**: 顯示個人化分析和建議

#### 6. ExportToolbar (匯出工具列)
```typescript
interface ExportToolbarProps {
  onExportCSV: () => void;
  onExportImage: () => void;
  onExportPDF: () => void;
  onShare: (format: ShareFormat) => void;
}
```
**職責**: 提供多種格式的數據匯出功能

### 數據介面定義

#### 核心數據模型
```typescript
interface WaterRecord {
  id: string;
  timestamp: Date;
  volume: number; // ml
  source?: string; // 記錄來源 (manual, reminder, etc.)
}

interface DailyStats {
  date: Date;
  totalVolume: number;
  goalVolume: number;
  achievementRate: number;
  recordCount: number;
  hourlyDistribution: HourlyData[];
}

interface WeeklyStats {
  weekStart: Date;
  dailyStats: DailyStats[];
  weeklyAverage: number;
  weekdayVsWeekend: ComparisonData;
}

interface MonthlyStats {
  month: Date;
  weeklyStats: WeeklyStats[];
  monthlyTrend: TrendData[];
  seasonalPattern: SeasonalData;
}
```

#### 分析結果模型
```typescript
interface PatternAnalysis {
  userType: 'morning' | 'afternoon' | 'evening' | 'balanced';
  peakHours: number[];
  lowIntakePeriods: TimeSlot[];
  consistency: number; // 0-1 一致性評分
}

interface InsightData {
  type: 'achievement' | 'improvement' | 'pattern' | 'recommendation';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}
```

## 數據模型

### 數據聚合策略

#### 1. 即時聚合 (Real-time Aggregation)
- **每日數據**: 即時計算當日統計
- **觸發條件**: 新增飲水記錄時
- **快取策略**: 記憶體快取 + LocalStorage 備份

#### 2. 批次聚合 (Batch Aggregation)
- **週/月數據**: 定期批次計算歷史統計
- **執行時機**: 每日凌晨 + 使用者首次開啟儀表板
- **儲存策略**: IndexedDB 持久化儲存

#### 3. 數據分層儲存
```typescript
// Level 1: 原始記錄 (IndexedDB)
interface RawDataStore {
  waterRecords: WaterRecord[];
  userGoals: GoalRecord[];
}

// Level 2: 聚合統計 (IndexedDB + Memory Cache)
interface AggregatedDataStore {
  dailyStats: Map<string, DailyStats>;
  weeklyStats: Map<string, WeeklyStats>;
  monthlyStats: Map<string, MonthlyStats>;
}

// Level 3: 計算結果 (Memory Cache)
interface ComputedDataStore {
  insights: InsightData[];
  patterns: PatternAnalysis;
  recommendations: Recommendation[];
}
```

### 效能優化策略

#### 1. 數據分頁載入
- **大數據集**: 超過 1000 筆記錄時啟用分頁
- **虛擬滾動**: 圖表數據點超過 500 個時使用虛擬化
- **漸進載入**: 優先載入當前檢視範圍的數據

#### 2. 計算快取
- **記憶化**: 使用 useMemo 快取昂貴的計算結果
- **增量更新**: 僅重新計算受影響的時間範圍
- **背景計算**: 使用 Web Workers 處理複雜分析

## 錯誤處理

### 錯誤分類和處理策略

#### 1. 數據載入錯誤
```typescript
interface DataLoadError {
  type: 'NETWORK_ERROR' | 'STORAGE_ERROR' | 'PARSE_ERROR';
  message: string;
  recoverable: boolean;
  retryStrategy?: RetryConfig;
}
```
**處理方式**:
- 顯示友善的錯誤訊息
- 提供重試機制 (最多 3 次)
- 降級到快取數據或預設值

#### 2. 圖表渲染錯誤
```typescript
interface ChartRenderError {
  chartType: string;
  dataSize: number;
  errorCode: string;
  fallbackAvailable: boolean;
}
```
**處理方式**:
- 自動切換到簡化版圖表
- 提供數據表格作為備選顯示
- 記錄錯誤供後續分析

#### 3. 匯出功能錯誤
```typescript
interface ExportError {
  format: 'CSV' | 'PDF' | 'IMAGE';
  dataSize: number;
  browserSupport: boolean;
}
```
**處理方式**:
- 分批匯出大型數據集
- 提供替代格式選項
- 顯示進度指示器

### 錯誤邊界實作
```typescript
class DashboardErrorBoundary extends React.Component {
  // 捕獲並處理元件樹中的錯誤
  // 提供優雅的降級體驗
  // 自動錯誤報告和恢復機制
}
```

## 測試策略

### 測試金字塔結構

#### 1. 單元測試 (70%)
**測試範圍**:
- 數據聚合函數
- 統計計算邏輯
- 日期處理工具
- 模式識別演算法

**測試工具**: Vitest + Testing Library

#### 2. 整合測試 (20%)
**測試範圍**:
- 元件間數據流
- 圖表渲染正確性
- 匯出功能完整性
- 快取機制驗證

**測試工具**: Vitest + MSW (Mock Service Worker)

#### 3. 端到端測試 (10%)
**測試範圍**:
- 完整使用者流程
- 跨瀏覽器相容性
- 效能基準測試
- 響應式設計驗證

**測試工具**: Playwright

### 效能測試
```typescript
interface PerformanceMetrics {
  initialLoadTime: number; // < 3s
  chartRenderTime: number; // < 1s
  dataAggregationTime: number; // < 500ms
  memoryUsage: number; // < 50MB
}
```

### 視覺回歸測試
- 使用 Chromatic 進行視覺化元件測試
- 確保圖表在不同數據集下的一致性
- 驗證響應式設計在各種螢幕尺寸下的表現

## 實作細節

### 圖表實作策略

#### 1. 時間軸視圖 (每日詳細)
```typescript
// 使用 Chart.js 的 Time Scale
const timelineConfig = {
  type: 'line',
  data: {
    datasets: [{
      label: '飲水量',
      data: hourlyData,
      borderColor: '#3B82F6',
      tension: 0.4
    }]
  },
  options: {
    scales: {
      x: {
        type: 'time',
        time: { unit: 'hour' },
        min: startOfDay,
        max: endOfDay
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }
};
```

#### 2. 熱力圖實作
```typescript
// 自訂 Canvas 渲染或使用 Chart.js Matrix
const heatmapData = generateHeatmapMatrix(waterRecords);
const heatmapConfig = {
  type: 'matrix',
  data: {
    datasets: [{
      data: heatmapData,
      backgroundColor: (ctx) => getHeatmapColor(ctx.parsed.v),
      width: ({chart}) => (chart.chartArea || {}).width / 24,
      height: ({chart}) => (chart.chartArea || {}).height / 7
    }]
  }
};
```

### 響應式設計實作

#### 1. 斷點策略
```css
/* Mobile First 設計 */
.dashboard-container {
  @apply grid grid-cols-1 gap-4;
}

@media (min-width: 768px) {
  .dashboard-container {
    @apply grid-cols-2;
  }
}

@media (min-width: 1024px) {
  .dashboard-container {
    @apply grid-cols-3;
  }
}
```

#### 2. 圖表響應式配置
```typescript
const responsiveOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: window.innerWidth > 768,
      position: window.innerWidth > 1024 ? 'right' : 'top'
    }
  }
};
```

### 匯出功能實作

#### 1. CSV 匯出
```typescript
const exportToCSV = (data: WaterRecord[]) => {
  const csv = Papa.unparse(data, {
    header: true,
    columns: ['timestamp', 'volume', 'goalAchieved']
  });
  downloadFile(csv, 'fillup-statistics.csv', 'text/csv');
};
```

#### 2. 圖片匯出
```typescript
const exportToImage = async (elementId: string) => {
  const canvas = await html2canvas(document.getElementById(elementId));
  const link = document.createElement('a');
  link.download = 'fillup-dashboard.png';
  link.href = canvas.toDataURL();
  link.click();
};
```

### 洞察分析演算法

#### 1. 使用者類型識別
```typescript
const identifyUserType = (records: WaterRecord[]): UserType => {
  const hourlyDistribution = calculateHourlyDistribution(records);
  const peakHours = findPeakHours(hourlyDistribution);
  
  if (peakHours.every(h => h < 12)) return 'morning';
  if (peakHours.every(h => h >= 12 && h < 18)) return 'afternoon';
  if (peakHours.every(h => h >= 18)) return 'evening';
  return 'balanced';
};
```

#### 2. 改善建議生成
```typescript
const generateRecommendations = (analysis: PatternAnalysis): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  
  if (analysis.lowIntakePeriods.length > 0) {
    recommendations.push({
      type: 'improvement',
      title: '加強午後飲水',
      description: '您在 14:00-16:00 期間飲水較少，建議設定提醒',
      priority: 'high'
    });
  }
  
  return recommendations;
};
```