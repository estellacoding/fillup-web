# Goal Management Spec

## 功能概述
實現 FillUp! 的每日目標設定與追蹤功能，允許用戶自訂每日飲水目標、活動時段，並即時計算完成率與進度節奏。

## 用戶旅程

### 主要旅程（P0）
1. **首次設定目標**
   - 新用戶註冊後進入目標設定頁
   - 選擇每日目標水量（預設 2100ml，可調整）
   - 設定活動時段（例：09:00-18:00）
   - 儲存後導向主儀表板

2. **查看目標進度**
   - 進入主頁面
   - 顯示「今日已完成 1250ml / 2100ml (59.5%)」
   - 顯示進度節奏指示（「進度良好」或「需加油」）

3. **調整目標設定**
   - 進入設定頁面
   - 修改目標水量或活動時段
   - 儲存後立即生效

## 技術要求

### 技術棧（參考 tech.md）
- **前端框架**: React 18+ with Next.js 14 App Router
- **狀態管理**: Zustand (goalStore)
- **UI 組件**: shadcn/ui + Tailwind CSS
- **資料驗證**: Zod
- **資料庫**: PostgreSQL + Prisma ORM

### 業務規則
- 目標水量範圍：500ml - 5000ml
- 活動時段：最少 4 小時，最多 18 小時
- 進度計算：當前水量 / 目標水量 × 100%
- 節奏判斷：依據當前時間在活動時段的位置，計算「應完成」比例

## 資料模型（參考 structure.md）

### Goal Model
```prisma
model Goal {
  id              String   @id @default(cuid())
  userId          String   @unique
  targetAmount    Int      // 目標水量 (ml)
  activeStartTime String   // 活動開始時間 (HH:mm)
  activeEndTime   String   // 活動結束時間 (HH:mm)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### TypeScript Types
```typescript
// types/goal.ts
export interface Goal {
  id: string
  userId: string
  targetAmount: number
  activeStartTime: string  // "HH:mm" format
  activeEndTime: string    // "HH:mm" format
  createdAt: Date
  updatedAt: Date
}

export interface UpdateGoalDto {
  targetAmount?: number
  activeStartTime?: string
  activeEndTime?: string
}

export interface GoalProgress {
  currentAmount: number
  targetAmount: number
  progress: number  // 百分比 (0-100)
  status: 'not-started' | 'on-track' | 'behind' | 'ahead' | 'completed'
  expectedProgress: number  // 根據時間計算的預期進度
}
```

## API 端點

```
GET    /api/goals             # 取得當前用戶的目標
PUT    /api/goals             # 更新目標（若不存在則建立）
GET    /api/goals/progress    # 取得今日目標進度
```

### API 請求/回應範例

#### GET /api/goals
```json
// Response (200 OK)
{
  "success": true,
  "data": {
    "id": "goal_123",
    "userId": "user_123",
    "targetAmount": 2100,
    "activeStartTime": "09:00",
    "activeEndTime": "18:00",
    "createdAt": "2025-11-01T08:00:00Z",
    "updatedAt": "2025-11-01T08:00:00Z"
  }
}

// Response (404 Not Found) - 用戶尚未設定目標
{
  "success": false,
  "error": {
    "code": "GOAL_NOT_FOUND",
    "message": "尚未設定每日目標"
  }
}
```

#### PUT /api/goals
```json
// Request
{
  "targetAmount": 2500,
  "activeStartTime": "08:00",
  "activeEndTime": "20:00"
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "id": "goal_123",
    "userId": "user_123",
    "targetAmount": 2500,
    "activeStartTime": "08:00",
    "activeEndTime": "20:00",
    "updatedAt": "2025-11-02T10:00:00Z"
  },
  "message": "目標已更新"
}
```

#### GET /api/goals/progress
```json
// Response (200 OK)
{
  "success": true,
  "data": {
    "currentAmount": 1250,
    "targetAmount": 2100,
    "progress": 59.5,
    "status": "on-track",
    "expectedProgress": 55.5,
    "message": "進度良好！繼續保持"
  }
}
```

## 組件結構（參考 structure.md）

```
app/
├── (dashboard)/
│   ├── settings/
│   │   └── page.tsx          # 目標設定頁面
│   └── onboarding/
│       └── goal-setup/
│           └── page.tsx      # 首次設定目標頁面
│
├── api/
│   └── goals/
│       ├── route.ts          # GET, PUT /api/goals
│       └── progress/
│           └── route.ts      # GET /api/goals/progress
│
components/
├── features/
│   └── goal/
│       ├── GoalSetupForm.tsx     # 目標設定表單
│       ├── GoalProgress.tsx      # 進度顯示組件
│       └── GoalStatusBadge.tsx   # 狀態徽章
│
lib/
├── stores/
│   └── goalStore.ts          # 目標狀態管理
├── hooks/
│   └── useGoal.ts            # 目標 Hook
└── utils/
    └── goal.ts               # 目標計算工具
```

## 實作細節

### 1. 目標計算工具 (lib/utils/goal.ts)
```typescript
interface TimeSlot {
  start: string  // "HH:mm"
  end: string    // "HH:mm"
}

/**
 * 計算預期進度百分比（根據當前時間在活動時段的位置）
 */
export function calculateExpectedProgress(timeSlot: TimeSlot): number {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const [startHour, startMin] = timeSlot.start.split(':').map(Number)
  const [endHour, endMin] = timeSlot.end.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  // 如果還沒到活動開始時間
  if (currentMinutes < startMinutes) {
    return 0
  }

  // 如果已超過活動結束時間
  if (currentMinutes >= endMinutes) {
    return 100
  }

  // 計算在活動時段中的百分比
  const totalMinutes = endMinutes - startMinutes
  const elapsedMinutes = currentMinutes - startMinutes
  return (elapsedMinutes / totalMinutes) * 100
}

/**
 * 判斷進度狀態
 */
export function getProgressStatus(
  currentProgress: number,
  expectedProgress: number
): GoalProgress['status'] {
  if (currentProgress === 0) return 'not-started'
  if (currentProgress >= 100) return 'completed'

  const diff = currentProgress - expectedProgress

  if (diff >= 10) return 'ahead'      // 超前 10% 以上
  if (diff >= -10) return 'on-track'  // 正常範圍內
  return 'behind'                      // 落後 10% 以上
}

/**
 * 取得狀態訊息
 */
export function getStatusMessage(status: GoalProgress['status']): string {
  const messages = {
    'not-started': '還沒開始喝水喔！',
    'on-track': '進度良好！繼續保持',
    'behind': '進度稍微落後，記得多喝水',
    'ahead': '太棒了！已超前進度',
    'completed': '恭喜達成今日目標！'
  }
  return messages[status]
}

/**
 * 驗證時間格式
 */
export function isValidTimeFormat(time: string): boolean {
  const regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  return regex.test(time)
}

/**
 * 計算活動時段長度（小時）
 */
export function calculateActiveHours(timeSlot: TimeSlot): number {
  const [startHour, startMin] = timeSlot.start.split(':').map(Number)
  const [endHour, endMin] = timeSlot.end.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  return (endMinutes - startMinutes) / 60
}
```

### 2. Zustand Store (lib/stores/goalStore.ts)
```typescript
import { create } from 'zustand'
import type { Goal, GoalProgress } from '@/types/goal'

interface GoalState {
  goal: Goal | null
  progress: GoalProgress | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchGoal: () => Promise<void>
  updateGoal: (data: UpdateGoalDto) => Promise<void>
  fetchProgress: () => Promise<void>
}

export const useGoalStore = create<GoalState>((set) => ({
  goal: null,
  progress: null,
  isLoading: false,
  error: null,

  fetchGoal: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/goals')

      if (response.status === 404) {
        set({ goal: null, isLoading: false })
        return
      }

      if (!response.ok) throw new Error('取得目標失敗')

      const { data } = await response.json()
      set({ goal: data, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  updateGoal: async (data: UpdateGoalDto) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('更新目標失敗')

      const { data: updatedGoal } = await response.json()
      set({ goal: updatedGoal, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  fetchProgress: async () => {
    try {
      const response = await fetch('/api/goals/progress')
      if (!response.ok) throw new Error('取得進度失敗')

      const { data } = await response.json()
      set({ progress: data })
    } catch (error) {
      set({ error: error.message })
    }
  }
}))
```

### 3. GoalSetupForm 組件 (components/features/goal/GoalSetupForm.tsx)
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGoalStore } from '@/lib/stores/goalStore'
import { calculateActiveHours, isValidTimeFormat } from '@/lib/utils/goal'
import { toast } from 'sonner'

interface GoalSetupFormProps {
  onComplete?: () => void
  initialData?: {
    targetAmount?: number
    activeStartTime?: string
    activeEndTime?: string
  }
}

export function GoalSetupForm({ onComplete, initialData }: GoalSetupFormProps) {
  const [targetAmount, setTargetAmount] = useState(initialData?.targetAmount || 2100)
  const [activeStartTime, setActiveStartTime] = useState(initialData?.activeStartTime || '09:00')
  const [activeEndTime, setActiveEndTime] = useState(initialData?.activeEndTime || '18:00')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { updateGoal, isLoading } = useGoalStore()

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 驗證目標水量
    if (targetAmount < 500 || targetAmount > 5000) {
      newErrors.targetAmount = '目標水量必須在 500-5000ml 之間'
    }

    // 驗證時間格式
    if (!isValidTimeFormat(activeStartTime)) {
      newErrors.activeStartTime = '時間格式錯誤（HH:mm）'
    }
    if (!isValidTimeFormat(activeEndTime)) {
      newErrors.activeEndTime = '時間格式錯誤（HH:mm）'
    }

    // 驗證活動時段長度
    const hours = calculateActiveHours({ start: activeStartTime, end: activeEndTime })
    if (hours < 4) {
      newErrors.activeEndTime = '活動時段至少需 4 小時'
    }
    if (hours > 18) {
      newErrors.activeEndTime = '活動時段不可超過 18 小時'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      await updateGoal({
        targetAmount,
        activeStartTime,
        activeEndTime
      })
      toast.success('目標設定成功！')
      onComplete?.()
    } catch (error) {
      toast.error('設定失敗，請稍後再試')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="targetAmount">每日目標水量</Label>
        <div className="flex items-center gap-2 mt-2">
          <Input
            id="targetAmount"
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(parseInt(e.target.value))}
            min={500}
            max={5000}
            step={50}
          />
          <span className="text-gray-600">ml</span>
        </div>
        {errors.targetAmount && (
          <p className="mt-1 text-sm text-red-600">{errors.targetAmount}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">建議：成人每日 2000-2500ml</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="activeStartTime">活動開始時間</Label>
          <Input
            id="activeStartTime"
            type="time"
            value={activeStartTime}
            onChange={(e) => setActiveStartTime(e.target.value)}
            className="mt-2"
          />
          {errors.activeStartTime && (
            <p className="mt-1 text-sm text-red-600">{errors.activeStartTime}</p>
          )}
        </div>

        <div>
          <Label htmlFor="activeEndTime">活動結束時間</Label>
          <Input
            id="activeEndTime"
            type="time"
            value={activeEndTime}
            onChange={(e) => setActiveEndTime(e.target.value)}
            className="mt-2"
          />
          {errors.activeEndTime && (
            <p className="mt-1 text-sm text-red-600">{errors.activeEndTime}</p>
          )}
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-900">
          活動時段長度：{calculateActiveHours({ start: activeStartTime, end: activeEndTime }).toFixed(1)} 小時
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? '儲存中...' : '儲存目標'}
      </Button>
    </form>
  )
}
```

### 4. GET /api/goals/progress 實作 (app/api/goals/progress/route.ts)
```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { calculateExpectedProgress, getProgressStatus, getStatusMessage } from '@/lib/utils/goal'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    // 取得目標
    const goal = await prisma.goal.findUnique({
      where: { userId: session.user.id }
    })

    if (!goal) {
      return NextResponse.json(
        { success: false, error: { code: 'GOAL_NOT_FOUND', message: '尚未設定目標' } },
        { status: 404 }
      )
    }

    // 取得今日飲水記錄
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const endOfDay = new Date(today.setHours(23, 59, 59, 999))

    const logs = await prisma.waterLog.findMany({
      where: {
        userId: session.user.id,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })

    const currentAmount = logs.reduce((sum, log) => sum + log.amount, 0)
    const progress = Math.min((currentAmount / goal.targetAmount) * 100, 100)

    // 計算預期進度
    const expectedProgress = calculateExpectedProgress({
      start: goal.activeStartTime,
      end: goal.activeEndTime
    })

    // 判斷狀態
    const status = getProgressStatus(progress, expectedProgress)

    return NextResponse.json({
      success: true,
      data: {
        currentAmount,
        targetAmount: goal.targetAmount,
        progress: Math.round(progress * 10) / 10,
        status,
        expectedProgress: Math.round(expectedProgress * 10) / 10,
        message: getStatusMessage(status)
      }
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '取得進度失敗' } },
      { status: 500 }
    )
  }
}
```

## 驗收標準

### 功能驗收
- [ ] 新用戶可設定每日目標與活動時段
- [ ] 用戶可查看當前目標設定
- [ ] 用戶可修改目標設定
- [ ] 系統正確計算完成百分比
- [ ] 系統正確計算預期進度
- [ ] 系統正確判斷進度狀態（領先/正常/落後）

### 資料驗證
- [ ] 目標水量範圍 500-5000ml
- [ ] 活動時段格式 HH:mm
- [ ] 活動時段長度 4-18 小時
- [ ] 開始時間必須早於結束時間

### UX 驗收
- [ ] 表單驗證即時回饋
- [ ] 顯示活動時段長度預覽
- [ ] 儲存成功後顯示 Toast 通知
- [ ] 錯誤訊息清楚易懂

### 效能驗收
- [ ] API 回應時間 < 200ms

## 測試策略

### 單元測試
- `calculateExpectedProgress()` 測試
- `getProgressStatus()` 測試
- `isValidTimeFormat()` 測試
- `calculateActiveHours()` 測試

### 整合測試
- PUT /api/goals 測試
- GET /api/goals/progress 測試
- 目標不存在時的處理

### E2E 測試
- 首次設定目標流程
- 修改目標流程
- 進度計算正確性

## 依賴關係
- **前置條件**: user-authentication（需要 Session）
- **後續依賴**: water-logging（計算進度需要飲水記錄）、water-visualization（顯示目標進度）

## 參考文件
- FillUp! Product Overview: `.kiro/steering/product.md` (核心功能 2: 每日目標追蹤)
- FillUp! Tech Stack: `.kiro/steering/tech.md`
- FillUp! Project Structure: `.kiro/steering/structure.md`
