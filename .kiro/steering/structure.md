---
title: Project Structure
inclusion: always
---

# 專案架構

## 目錄結構

```
fillup-web/
├── .kiro/                      # Kiro 配置與規格文件
│   └── steering/
│       ├── product.md          # 產品概述
│       ├── tech.md            # 技術棧文件
│       └── structure.md       # 本文件
│
├── app/                       # Next.js App Router
│   ├── (auth)/               # 認證相關路由群組
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/          # 主應用路由群組
│   │   ├── page.tsx          # 主頁面 - 水桶進度視圖
│   │   ├── stats/            # 統計儀表板
│   │   ├── achievements/     # 成就與徽章
│   │   └── settings/         # 設定頁面
│   ├── api/                  # API Routes
│   │   ├── water/            # 飲水記錄 CRUD
│   │   ├── goals/            # 目標管理
│   │   ├── achievements/     # 成就系統
│   │   └── auth/             # NextAuth 配置
│   ├── layout.tsx            # 根佈局
│   ├── globals.css           # 全域樣式
│   └── providers.tsx         # Context Providers
│
├── components/               # React 組件
│   ├── ui/                   # 基礎 UI 組件 (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── features/             # 功能性組件
│   │   ├── water-bucket/     # 水桶視覺化
│   │   │   ├── WaterBucket.tsx
│   │   │   ├── WaterLevel.tsx
│   │   │   └── FillAnimation.tsx
│   │   ├── water-input/      # 快速輸入
│   │   │   ├── QuickInput.tsx
│   │   │   ├── CustomInput.tsx
│   │   │   └── HistoryButtons.tsx
│   │   ├── stats/            # 統計視圖
│   │   │   ├── DailyChart.tsx
│   │   │   ├── WeeklyChart.tsx
│   │   │   └── MonthlyChart.tsx
│   │   ├── achievements/     # 成就系統
│   │   │   ├── BadgeGrid.tsx
│   │   │   ├── BadgeCard.tsx
│   │   │   └── CelebrationModal.tsx
│   │   └── reminders/        # 提醒設定
│   │       └── ReminderConfig.tsx
│   └── layout/               # 佈局組件
│       ├── Header.tsx
│       ├── Navigation.tsx
│       └── Footer.tsx
│
├── lib/                      # 工具函數與配置
│   ├── db/                   # 資料庫相關
│   │   └── prisma.ts         # Prisma 客戶端實例
│   ├── utils/                # 通用工具函數
│   │   ├── cn.ts             # Class name 合併 (clsx + tailwind-merge)
│   │   ├── date.ts           # 日期處理
│   │   ├── water.ts          # 飲水相關計算
│   │   └── validators.ts     # 資料驗證
│   ├── hooks/                # 自訂 React Hooks
│   │   ├── useWaterLog.ts
│   │   ├── useGoal.ts
│   │   ├── useStats.ts
│   │   └── useNotifications.ts
│   ├── stores/               # Zustand 狀態管理
│   │   ├── waterStore.ts     # 飲水記錄狀態
│   │   ├── goalStore.ts      # 目標狀態
│   │   └── uiStore.ts        # UI 狀態
│   ├── constants/            # 常數定義
│   │   ├── water.ts          # 預設容量、單位等
│   │   └── achievements.ts   # 成就定義
│   └── auth.ts               # NextAuth 配置
│
├── types/                    # TypeScript 型別定義
│   ├── water.ts              # 飲水記錄相關型別
│   ├── goal.ts               # 目標相關型別
│   ├── achievement.ts        # 成就相關型別
│   └── user.ts               # 使用者相關型別
│
├── prisma/                   # Prisma ORM
│   ├── schema.prisma         # 資料庫 Schema
│   ├── migrations/           # 資料庫遷移
│   └── seed.ts               # 資料庫種子資料
│
├── public/                   # 靜態資源
│   ├── images/               # 圖片資源
│   │   ├── badges/           # 徽章圖示
│   │   └── illustrations/    # 插圖
│   ├── icons/                # 圖示
│   └── fonts/                # 自訂字體
│
├── tests/                    # 測試檔案
│   ├── unit/                 # 單元測試
│   ├── integration/          # 整合測試
│   └── e2e/                  # 端到端測試
│
├── .env.local                # 環境變數 (本地開發)
├── .env.example              # 環境變數範例
├── .eslintrc.json            # ESLint 配置
├── .prettierrc               # Prettier 配置
├── next.config.js            # Next.js 配置
├── tailwind.config.ts        # Tailwind CSS 配置
├── tsconfig.json             # TypeScript 配置
├── package.json              # 專案依賴
└── README.md                 # 專案說明
```

## 命名規範

### 檔案命名
- **組件檔案**: PascalCase (例: `WaterBucket.tsx`, `QuickInput.tsx`)
- **工具函數**: camelCase (例: `utils.ts`, `validators.ts`)
- **常數檔案**: camelCase (例: `constants.ts`)
- **型別檔案**: camelCase (例: `water.ts`, `goal.ts`)
- **Hooks**: camelCase，以 `use` 開頭 (例: `useWaterLog.ts`)

### 變數與函數命名
- **變數**: camelCase (例: `waterAmount`, `dailyGoal`)
- **常數**: UPPER_SNAKE_CASE (例: `DEFAULT_WATER_GOAL`, `MAX_CUSTOM_INPUT`)
- **函數**: camelCase (例: `calculateProgress`, `formatDate`)
- **組件**: PascalCase (例: `WaterBucket`, `QuickInput`)
- **型別/介面**: PascalCase (例: `WaterLog`, `UserGoal`)

### CSS 類別命名
- 使用 Tailwind CSS 實用類別為主
- 自訂類別使用 kebab-case (例: `water-bucket-container`)
- BEM 命名法用於複雜組件 (例: `bucket__level--full`)

## 資料模型

### 核心實體

#### User (使用者)
```typescript
{
  id: string
  email: string
  name?: string
  createdAt: Date
  updatedAt: Date
  goal: Goal?
  waterLogs: WaterLog[]
  achievements: UserAchievement[]
}
```

#### Goal (目標)
```typescript
{
  id: string
  userId: string
  targetAmount: number      // 目標水量 (ml)
  activeStartTime: string   // 活動開始時間 (HH:mm)
  activeEndTime: string     // 活動結束時間 (HH:mm)
  createdAt: Date
  updatedAt: Date
}
```

#### WaterLog (飲水記錄)
```typescript
{
  id: string
  userId: string
  amount: number           // 水量 (ml)
  timestamp: Date
  createdAt: Date
}
```

#### Achievement (成就)
```typescript
{
  id: string
  name: string
  description: string
  type: 'streak' | 'milestone' | 'perfect-week'
  criteria: object         // JSON: 達成條件
  badgeUrl: string
  createdAt: Date
}
```

#### UserAchievement (使用者成就)
```typescript
{
  id: string
  userId: string
  achievementId: string
  unlockedAt: Date
}
```

## 匯入規範

### 路徑別名 (tsconfig.json)
```typescript
{
  "@/*": "./*",
  "@/components/*": "./components/*",
  "@/lib/*": "./lib/*",
  "@/types/*": "./types/*",
  "@/app/*": "./app/*"
}
```

### 匯入順序
1. React 與 Next.js 核心
2. 第三方套件
3. 內部組件
4. 工具函數與 Hooks
5. 型別定義
6. 樣式

範例:
```typescript
// 1. React & Next.js
import { useState } from 'react'
import Image from 'next/image'

// 2. 第三方套件
import { motion } from 'framer-motion'
import { format } from 'date-fns'

// 3. 內部組件
import { Button } from '@/components/ui/button'
import { WaterBucket } from '@/components/features/water-bucket'

// 4. 工具函數與 Hooks
import { useWaterLog } from '@/lib/hooks/useWaterLog'
import { calculateProgress } from '@/lib/utils/water'

// 5. 型別
import type { WaterLog } from '@/types/water'

// 6. 樣式 (若有獨立 CSS 模組)
import styles from './styles.module.css'
```

## 組件架構原則

### 組件分類
1. **Presentational Components (展示組件)**
   - 只負責 UI 呈現
   - 透過 props 接收資料
   - 無狀態或僅有 UI 狀態
   - 範例: `Button`, `Card`, `Badge`

2. **Container Components (容器組件)**
   - 處理業務邏輯與資料獲取
   - 使用 Hooks 管理狀態
   - 將資料傳遞給展示組件
   - 範例: `WaterDashboard`, `StatsContainer`

3. **Feature Components (功能組件)**
   - 結合展示與邏輯
   - 封裝完整功能模組
   - 範例: `WaterBucket`, `QuickInput`

### 組件結構範本
```typescript
// components/features/water-bucket/WaterBucket.tsx

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useWaterLog } from '@/lib/hooks/useWaterLog'
import type { Goal } from '@/types/goal'

interface WaterBucketProps {
  goal: Goal
  className?: string
}

export function WaterBucket({ goal, className }: WaterBucketProps) {
  // 1. Hooks
  const { logs, progress } = useWaterLog()
  const [isAnimating, setIsAnimating] = useState(false)

  // 2. 事件處理函數
  const handleFillComplete = () => {
    setIsAnimating(true)
  }

  // 3. 衍生狀態
  const percentage = Math.min((progress / goal.targetAmount) * 100, 100)

  // 4. 渲染
  return (
    <div className={className}>
      {/* 組件內容 */}
    </div>
  )
}
```

## API 路由規範

### RESTful 結構
```
POST   /api/water          # 新增飲水記錄
GET    /api/water          # 取得飲水記錄列表
GET    /api/water/[id]     # 取得單筆記錄
DELETE /api/water/[id]     # 刪除記錄

GET    /api/goals          # 取得目標
PUT    /api/goals          # 更新目標

GET    /api/stats/daily    # 每日統計
GET    /api/stats/weekly   # 每週統計
GET    /api/stats/monthly  # 每月統計

GET    /api/achievements   # 取得成就列表
```

### 回應格式
```typescript
// 成功回應
{
  success: true,
  data: { /* 資料 */ },
  message?: string
}

// 錯誤回應
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: '錯誤訊息',
    details?: { /* 額外資訊 */ }
  }
}
```

## 狀態管理策略

### Zustand Store 組織
- **waterStore**: 飲水記錄、快速輸入歷史
- **goalStore**: 使用者目標設定
- **uiStore**: UI 狀態 (modal 開關、theme 等)

### Server State vs Client State
- **Server State** (透過 API 獲取): 使用 SWR 或 React Query
- **Client State** (UI 互動): 使用 Zustand
- **Form State**: 使用 React Hook Form

## 效能最佳化策略

1. **程式碼分割**
   - 動態匯入大型組件 (`next/dynamic`)
   - 路由層級的自動分割 (Next.js App Router)

2. **圖片最佳化**
   - 使用 `next/image` 組件
   - WebP 格式優先
   - 適當的 sizes 與 srcset

3. **資料獲取**
   - 使用 React Server Components (RSC)
   - 實作適當的快取策略
   - 避免 waterfall requests

4. **動畫效能**
   - 使用 GPU 加速屬性 (transform, opacity)
   - 避免 layout thrashing
   - Framer Motion 的 `layoutId` 優化

## 開發流程

### 分支策略
- `main`: 生產環境
- `develop`: 開發環境
- `feature/*`: 功能開發
- `bugfix/*`: 錯誤修復
- `hotfix/*`: 緊急修復

### Commit 訊息規範
遵循 Conventional Commits:
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

Type:
- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文件更新
- `style`: 程式碼格式調整
- `refactor`: 重構
- `test`: 測試相關
- `chore`: 建置或工具變更

範例:
```
feat(water-bucket): add celebration animation on goal completion
fix(api): resolve timezone issue in daily stats
docs(readme): update setup instructions
```

## 部署流程


### 環境變數管理
- `.env.local`: 本地開發 (不提交)
- `.env.example`: 範本檔案 (提交)
- Vercel Dashboard: 各環境變數設定
