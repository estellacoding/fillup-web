# Stats Dashboard Spec

## 功能概述
實現 FillUp! 的統計儀表板，提供每日、每週、每月的飲水數據分析，讓用戶透過視覺化圖表了解飲水模式與趨勢。

## 用戶旅程

### 主要旅程（P0）
1. **查看每日統計**
   - 用戶進入統計頁面
   - 預設顯示今日統計
   - 看到每小時的飲水分布柱狀圖
   - 顯示今日總量、平均每次飲水量、記錄次數

2. **切換週視圖**
   - 用戶點擊「週」Tab
   - 看到本週 7 天的達成率折線圖
   - 顯示本週平均水量、最佳/最差日期
   - 顯示週目標達成率（例：5/7 天達標）

3. **分析飲水模式**
   - 用戶切換至月視圖
   - 看到 30 天的趨勢線
   - 系統顯示洞察分析（例：「你通常在下午 3-5 點喝水最多」）

## 技術要求

### 技術棧（參考 tech.md）
- **圖表庫**: Recharts
- **日期處理**: date-fns
- **狀態管理**: Zustand (statsStore)
- **資料查詢**: Prisma ORM

### 圖表類型
- 每日：柱狀圖（每小時分布）
- 每週：折線圖（7 天達成率）
- 每月：面積圖（30 天趨勢）

## 資料模型

### Stats API Response
```typescript
// types/stats.ts
export interface DailyStats {
  date: string  // YYYY-MM-DD
  totalAmount: number
  goalAmount: number
  logCount: number
  averageAmount: number
  hourlyDistribution: {
    hour: number  // 0-23
    amount: number
  }[]
}

export interface WeeklyStats {
  startDate: string
  endDate: string
  totalAmount: number
  averageDaily: number
  goalsAchieved: number
  totalDays: number
  dailyData: {
    date: string
    amount: number
    goalAmount: number
    achieved: boolean
  }[]
}

export interface MonthlyStats {
  month: string  // YYYY-MM
  totalAmount: number
  averageDaily: number
  bestDay: { date: string; amount: number }
  worstDay: { date: string; amount: number }
  dailyData: {
    date: string
    amount: number
  }[]
}

export interface StatsInsights {
  peakHours: number[]  // 飲水高峰時段
  consistencyScore: number  // 一致性分數 (0-100)
  trendDirection: 'up' | 'down' | 'stable'
  suggestions: string[]
}
```

## API 端點

```
GET    /api/stats/daily?date=YYYY-MM-DD    # 每日統計
GET    /api/stats/weekly?week=YYYY-WW      # 每週統計
GET    /api/stats/monthly?month=YYYY-MM    # 每月統計
GET    /api/stats/insights                 # 洞察分析
```

## 組件結構（參考 structure.md）

```
app/
├── (dashboard)/
│   └── stats/
│       └── page.tsx              # 統計頁面
│
├── api/
│   └── stats/
│       ├── daily/
│       │   └── route.ts
│       ├── weekly/
│       │   └── route.ts
│       ├── monthly/
│       │   └── route.ts
│       └── insights/
│           └── route.ts
│
components/
├── features/
│   └── stats/
│       ├── DailyChart.tsx        # 每日圖表
│       ├── WeeklyChart.tsx       # 每週圖表
│       ├── MonthlyChart.tsx      # 每月圖表
│       ├── StatsCard.tsx         # 統計卡片
│       ├── InsightPanel.tsx      # 洞察面板
│       └── DateRangePicker.tsx   # 日期選擇器
```

## 實作細節

### 1. DailyChart 組件 (components/features/stats/DailyChart.tsx)
```typescript
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { DailyStats } from '@/types/stats'

interface DailyChartProps {
  data: DailyStats
}

export function DailyChart({ data }: DailyChartProps) {
  return (
    <div className="space-y-4">
      {/* 摘要卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          label="今日總量"
          value={`${data.totalAmount}ml`}
          subtext={`目標 ${data.goalAmount}ml`}
        />
        <StatsCard
          label="記錄次數"
          value={data.logCount}
          subtext="次"
        />
        <StatsCard
          label="平均每次"
          value={`${data.averageAmount}ml`}
        />
      </div>

      {/* 每小時分布圖 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">每小時飲水分布</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.hourlyDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="hour"
              tickFormatter={(hour) => `${hour}:00`}
            />
            <YAxis label={{ value: 'ml', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              formatter={(value) => [`${value}ml`, '飲水量']}
              labelFormatter={(hour) => `${hour}:00 - ${hour + 1}:00`}
            />
            <Bar dataKey="amount" fill="#3B82F6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

### 2. WeeklyChart 組件 (components/features/stats/WeeklyChart.tsx)
```typescript
'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format } from 'date-fns'
import type { WeeklyStats } from '@/types/stats'

interface WeeklyChartProps {
  data: WeeklyStats
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const achievementRate = (data.goalsAchieved / data.totalDays) * 100

  return (
    <div className="space-y-4">
      {/* 摘要卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          label="本週總量"
          value={`${data.totalAmount}ml`}
        />
        <StatsCard
          label="每日平均"
          value={`${data.averageDaily}ml`}
        />
        <StatsCard
          label="達標天數"
          value={`${data.goalsAchieved}/${data.totalDays}`}
          subtext={`${Math.round(achievementRate)}%`}
        />
      </div>

      {/* 週趨勢圖 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">本週飲水趨勢</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), 'E')}
            />
            <YAxis label={{ value: 'ml', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              formatter={(value) => [`${value}ml`, '飲水量']}
              labelFormatter={(date) => format(new Date(date), 'yyyy/MM/dd')}
            />
            <ReferenceLine
              y={data.dailyData[0]?.goalAmount || 2100}
              stroke="#10B981"
              strokeDasharray="5 5"
              label="目標"
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={payload.achieved ? '#10B981' : '#EF4444'}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

### 3. GET /api/stats/daily 實作 (app/api/stats/daily/route.ts)
```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const targetDate = new Date(dateParam)
    const start = startOfDay(targetDate)
    const end = endOfDay(targetDate)

    // 取得當日飲水記錄
    const logs = await prisma.waterLog.findMany({
      where: {
        userId: session.user.id,
        timestamp: {
          gte: start,
          lte: end
        }
      },
      orderBy: { timestamp: 'asc' }
    })

    // 取得目標
    const goal = await prisma.goal.findUnique({
      where: { userId: session.user.id }
    })

    // 計算統計數據
    const totalAmount = logs.reduce((sum, log) => sum + log.amount, 0)
    const logCount = logs.length
    const averageAmount = logCount > 0 ? Math.round(totalAmount / logCount) : 0

    // 計算每小時分布
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const hourLogs = logs.filter(log => new Date(log.timestamp).getHours() === hour)
      return {
        hour,
        amount: hourLogs.reduce((sum, log) => sum + log.amount, 0)
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        date: dateParam,
        totalAmount,
        goalAmount: goal?.targetAmount || 2100,
        logCount,
        averageAmount,
        hourlyDistribution
      }
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '取得統計失敗' } },
      { status: 500 }
    )
  }
}
```

### 4. InsightPanel 組件 (components/features/stats/InsightPanel.tsx)
```typescript
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { StatsInsights } from '@/types/stats'

export function InsightPanel() {
  const [insights, setInsights] = useState<StatsInsights | null>(null)

  useEffect(() => {
    fetch('/api/stats/insights')
      .then(res => res.json())
      .then(data => setInsights(data.data))
  }, [])

  if (!insights) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg"
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        💡 洞察分析
      </h3>

      <div className="space-y-3">
        {/* 飲水高峰時段 */}
        <div>
          <p className="text-sm text-gray-600">飲水高峰時段</p>
          <p className="text-base font-medium">
            {insights.peakHours.map(h => `${h}:00`).join(', ')}
          </p>
        </div>

        {/* 一致性分數 */}
        <div>
          <p className="text-sm text-gray-600">飲水一致性</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${insights.consistencyScore}%` }}
              />
            </div>
            <span className="text-sm font-medium">{insights.consistencyScore}%</span>
          </div>
        </div>

        {/* 趨勢方向 */}
        <div>
          <p className="text-sm text-gray-600">飲水趨勢</p>
          <p className="text-base font-medium">
            {insights.trendDirection === 'up' && '📈 持續進步中'}
            {insights.trendDirection === 'down' && '📉 稍微退步'}
            {insights.trendDirection === 'stable' && '➡️ 穩定維持'}
          </p>
        </div>

        {/* 建議 */}
        {insights.suggestions.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">建議</p>
            <ul className="space-y-1">
              {insights.suggestions.map((suggestion, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span>•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  )
}
```

## 驗收標準

### 功能驗收
- [ ] 每日統計正確顯示每小時分布
- [ ] 每週統計正確顯示 7 天趨勢
- [ ] 每月統計正確顯示 30 天數據
- [ ] 統計卡片數據正確
- [ ] 洞察分析有意義

### 圖表驗收
- [ ] 圖表響應式設計（mobile / desktop）
- [ ] Tooltip 正確顯示資訊
- [ ] 目標線正確標示
- [ ] 顏色區分達標/未達標

### 效能驗收
- [ ] API 回應時間 < 500ms
- [ ] 圖表渲染流暢
- [ ] 切換 Tab 無延遲

## 測試策略

### 單元測試
- 統計數據計算邏輯
- 洞察分析演算法

### 整合測試
- API 端點測試
- 資料聚合正確性

### E2E 測試
- 完整統計查看流程
- Tab 切換流程

## 依賴關係
- **前置條件**: water-logging（提供飲水記錄）、goal-management（提供目標設定）
- **後續依賴**: 無

## 參考文件
- FillUp! Product Overview: `.kiro/steering/product.md` (核心功能 5: 統計儀表板)
- Recharts 文件: https://recharts.org/
