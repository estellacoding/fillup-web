/**
 * 核心 TypeScript 介面定義
 */

// API 回應基礎介面
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  status: number;
}

// 錯誤處理介面
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// 飲水記錄相關介面
export interface HydrationRecord {
  id: string;
  volume: number; // ml
  timestamp: Date;
  synced: boolean;
  localId?: string; // 離線時的本地 ID
}

export interface HydrationCreate {
  volume: number;
  recorded_at?: Date;
}

export interface HydrationUpdate {
  volume?: number;
  recorded_at?: Date;
}

export interface DailySummary {
  date: string;
  totalVolume: number;
  goalVolume: number;
  completionRate: number;
  recordCount: number;
}

// 使用者設定介面
export interface UserSettings {
  dailyGoal: number; // ml
  reminderEnabled: boolean;
  reminderInterval: number; // minutes
  activeHours: {
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
  preferredUnit: 'ml' | 'l' | 'oz' | 'cup';
  theme: 'light' | 'dark' | 'auto';
}

// 成就系統介面
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'daily' | 'weekly' | 'monthly' | 'milestone';
  requirement: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

// 統計資料介面
export interface HydrationStats {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  totalVolume: number;
  averageVolume: number;
  goalAchievementRate: number;
  bestStreak: number;
  currentStreak: number;
  records: HydrationRecord[];
}

// 離線同步介面
export interface OfflineRecord {
  localId: string;
  action: 'create' | 'update' | 'delete';
  data: HydrationRecord | Partial<HydrationRecord>;
  timestamp: number;
  retryCount: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncAt?: Date;
  pendingCount: number;
  isSyncing: boolean;
  syncError?: string;
}

// 通知介面
export interface NotificationConfig {
  enabled: boolean;
  type: 'browser' | 'push';
  title: string;
  body: string;
  icon?: string;
  scheduledAt?: Date;
}

// 動畫配置介面
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  repeat?: number;
}

// 元件 Props 介面
export interface BucketVisualizerProps {
  currentAmount: number;
  dailyGoal: number;
  isAnimating: boolean;
  onAnimationComplete?: () => void;
  showCelebration?: boolean;
}

export interface QuickInputButtonsProps {
  onVolumeSelect: (volume: number) => void;
  isLoading: boolean;
  presetVolumes: number[];
  disabled?: boolean;
}

// 表單驗證介面
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox';
  value: any;
  rules?: ValidationRule[];
  error?: string;
}

// 路由介面
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  protected?: boolean;
  title?: string;
}

// 主題配置介面
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}