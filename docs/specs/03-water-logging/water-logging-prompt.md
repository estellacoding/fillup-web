# Water Logging Spec

## 功能概述
實現 FillUp! 的飲水記錄核心功能，提供快速容量輸入、自訂輸入、歷史記錄快捷按鈕，讓用戶在 3 秒內完成記錄。

## 用戶旅程

### 主要旅程（P0）
1. **快速記錄飲水**
   - 用戶點擊預設按鈕（250ml / 350ml / 500ml）
   - 系統立即記錄並觸發水桶填充動畫
   - 顯示「已添加 250ml」Toast 通知

2. **自訂容量輸入**
   - 用戶點擊「自訂」按鈕
   - 彈出數字輸入框
   - 輸入容量（例：180ml）並確認
   - 系統記錄並更新進度

3. **使用歷史記錄快捷**
   - 系統顯示最近 5 次的記錄容量
   - 用戶點擊歷史按鈕（例：「180ml」）
   - 快速添加該容量

## 技術要求

### 技術棧（參考 tech.md）
- **前端框架**: React 18+ with Next.js 14 App Router
- **狀態管理**: Zustand (waterStore)
- **UI 組件**: shadcn/ui + Tailwind CSS
- **動畫**: Framer Motion
- **資料驗證**: Zod
- **資料庫**: PostgreSQL + Prisma ORM

### 效能要求
- 點擊到 UI 回饋時間 < 100ms
- API 回應時間 < 200ms
- 動畫幀率維持 60 FPS

## 資料模型（參考 structure.md）

### WaterLog Model
```prisma
model WaterLog {
  id        String   @id @default(cuid())
  userId    String
  amount    Int      // 水量 (ml)
  timestamp DateTime @default(now())
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, timestamp])
}
```

### TypeScript Types
```typescript
// types/water.ts
export interface WaterLog {
  id: string
  userId: string
  amount: number
  timestamp: Date
  createdAt: Date
}

export interface CreateWaterLogDto {
  amount: number
  timestamp?: Date
}

export interface WaterLogHistory {
  amount: number
  count: number
  lastUsed: Date
}
```

## API 端點

```
POST   /api/water              # 新增飲水記錄
GET    /api/water              # 取得飲水記錄列表（支援日期篩選）
GET    /api/water/[id]         # 取得單筆記錄
DELETE /api/water/[id]         # 刪除記錄
GET    /api/water/history      # 取得最近使用的容量（用於歷史快捷）
GET    /api/water/today        # 取得今日總量與記錄
```

### API 請求/回應範例

#### POST /api/water
```json
// Request
{
  "amount": 250,
  "timestamp": "2025-11-02T10:30:00Z" // 選填，預設為當前時間
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "userId": "user_123",
    "amount": 250,
    "timestamp": "2025-11-02T10:30:00Z",
    "createdAt": "2025-11-02T10:30:00Z"
  },
  "message": "已添加 250ml"
}
```

#### GET /api/water/today
```json
// Response (200 OK)
{
  "success": true,
  "data": {
    "totalAmount": 1250,
    "goalAmount": 2100,
    "progress": 59.5,
    "logs": [
      {
        "id": "log1",
        "amount": 250,
        "timestamp": "2025-11-02T08:00:00Z"
      },
      {
        "id": "log2",
        "amount": 500,
        "timestamp": "2025-11-02T10:30:00Z"
      },
      {
        "id": "log3",
        "amount": 250,
        "timestamp": "2025-11-02T12:00:00Z"
      },
      {
        "id": "log4",
        "amount": 250,
        "timestamp": "2025-11-02T14:30:00Z"
      }
    ]
  }
}
```

#### GET /api/water/history
```json
// Response (200 OK)
{
  "success": true,
  "data": [
    { "amount": 250, "count": 15, "lastUsed": "2025-11-02T14:30:00Z" },
    { "amount": 500, "count": 8, "lastUsed": "2025-11-02T10:30:00Z" },
    { "amount": 350, "count": 5, "lastUsed": "2025-11-01T16:00:00Z" },
    { "amount": 180, "count": 3, "lastUsed": "2025-11-01T09:00:00Z" },
    { "amount": 300, "count": 2, "lastUsed": "2025-10-30T11:00:00Z" }
  ]
}
```

## 組件結構（參考 structure.md）

```
app/
├── (dashboard)/
│   └── page.tsx              # 主頁面（包含快速輸入組件）
│
├── api/
│   └── water/
│       ├── route.ts          # POST /api/water, GET /api/water
│       ├── [id]/
│       │   └── route.ts      # GET, DELETE /api/water/[id]
│       ├── history/
│       │   └── route.ts      # GET /api/water/history
│       └── today/
│           └── route.ts      # GET /api/water/today
│
components/
├── features/
│   └── water-input/
│       ├── QuickInput.tsx    # 快速輸入組件（主要）
│       ├── CustomInput.tsx   # 自訂容量輸入
│       ├── HistoryButtons.tsx # 歷史快捷按鈕
│       └── WaterLogItem.tsx  # 單筆記錄顯示
│
lib/
├── stores/
│   └── waterStore.ts         # 飲水記錄狀態管理
├── hooks/
│   └── useWaterLog.ts        # 飲水記錄 Hook
└── utils/
    └── water.ts              # 飲水相關計算工具
```

## 實作細節

### 1. Zustand Store (lib/stores/waterStore.ts)
```typescript
import { create } from 'zustand'
import type { WaterLog } from '@/types/water'

interface WaterState {
  logs: WaterLog[]
  todayTotal: number
  isLoading: boolean
  error: string | null

  // Actions
  addLog: (amount: number) => Promise<void>
  fetchTodayLogs: () => Promise<void>
  deleteLog: (id: string) => Promise<void>
  setLogs: (logs: WaterLog[]) => void
}

export const useWaterStore = create<WaterState>((set, get) => ({
  logs: [],
  todayTotal: 0,
  isLoading: false,
  error: null,

  addLog: async (amount: number) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      })

      if (!response.ok) throw new Error('新增記錄失敗')

      const { data } = await response.json()

      set(state => ({
        logs: [data, ...state.logs],
        todayTotal: state.todayTotal + amount,
        isLoading: false
      }))
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  fetchTodayLogs: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/water/today')
      if (!response.ok) throw new Error('取得記錄失敗')

      const { data } = await response.json()

      set({
        logs: data.logs,
        todayTotal: data.totalAmount,
        isLoading: false
      })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  deleteLog: async (id: string) => {
    const logToDelete = get().logs.find(log => log.id === id)
    if (!logToDelete) return

    try {
      const response = await fetch(`/api/water/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('刪除記錄失敗')

      set(state => ({
        logs: state.logs.filter(log => log.id !== id),
        todayTotal: state.todayTotal - logToDelete.amount
      }))
    } catch (error) {
      set({ error: error.message })
    }
  },

  setLogs: (logs: WaterLog[]) => set({ logs })
}))
```

### 2. QuickInput 組件 (components/features/water-input/QuickInput.tsx)
```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { CustomInput } from './CustomInput'
import { HistoryButtons } from './HistoryButtons'
import { useWaterStore } from '@/lib/stores/waterStore'
import { toast } from 'sonner'

const DEFAULT_AMOUNTS = [250, 350, 500]

export function QuickInput() {
  const [showCustomInput, setShowCustomInput] = useState(false)
  const { addLog, isLoading } = useWaterStore()

  const handleQuickAdd = async (amount: number) => {
    try {
      await addLog(amount)
      toast.success(`已添加 ${amount}ml`)
    } catch (error) {
      toast.error('記錄失敗，請稍後再試')
    }
  }

  return (
    <div className="space-y-4">
      {/* 預設按鈕 */}
      <div className="grid grid-cols-3 gap-3">
        {DEFAULT_AMOUNTS.map((amount) => (
          <motion.div
            key={amount}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              variant="default"
              className="w-full h-20 text-2xl font-bold"
              onClick={() => handleQuickAdd(amount)}
              disabled={isLoading}
            >
              {amount}ml
            </Button>
          </motion.div>
        ))}
      </div>

      {/* 自訂按鈕 */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setShowCustomInput(true)}
      >
        自訂容量
      </Button>

      {/* 歷史快捷 */}
      <HistoryButtons onSelect={handleQuickAdd} />

      {/* 自訂輸入 Modal */}
      {showCustomInput && (
        <CustomInput
          onClose={() => setShowCustomInput(false)}
          onSubmit={handleQuickAdd}
        />
      )}
    </div>
  )
}
```

### 3. CustomInput 組件 (components/features/water-input/CustomInput.tsx)
```typescript
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CustomInputProps {
  onClose: () => void
  onSubmit: (amount: number) => Promise<void>
}

export function CustomInput({ onClose, onSubmit }: CustomInputProps) {
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    const numAmount = parseInt(amount, 10)

    if (isNaN(numAmount) || numAmount <= 0) {
      return
    }

    if (numAmount > 2000) {
      alert('單次記錄不可超過 2000ml')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(numAmount)
      onClose()
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>自訂容量</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Input
              type="number"
              placeholder="輸入容量 (ml)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              min={1}
              max={2000}
            />
            <p className="mt-2 text-sm text-gray-500">
              請輸入 1-2000ml 之間的數值
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              取消
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? '記錄中...' : '確認'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### 4. POST /api/water 實作 (app/api/water/route.ts)
```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createWaterLogSchema = z.object({
  amount: z.number().int().min(1).max(2000),
  timestamp: z.string().datetime().optional()
})

export async function POST(request: Request) {
  try {
    // 驗證認證
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '請先登入' } },
        { status: 401 }
      )
    }

    // 驗證請求資料
    const body = await request.json()
    const { amount, timestamp } = createWaterLogSchema.parse(body)

    // 建立記錄
    const waterLog = await prisma.waterLog.create({
      data: {
        userId: session.user.id,
        amount,
        timestamp: timestamp ? new Date(timestamp) : new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: waterLog,
      message: `已添加 ${amount}ml`
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '容量必須在 1-2000ml 之間' } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '記錄失敗，請稍後再試' } },
      { status: 500 }
    )
  }
}

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
    const date = searchParams.get('date') // YYYY-MM-DD

    const startOfDay = date ? new Date(`${date}T00:00:00Z`) : new Date(new Date().setHours(0, 0, 0, 0))
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

    const logs = await prisma.waterLog.findMany({
      where: {
        userId: session.user.id,
        timestamp: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      orderBy: { timestamp: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: logs
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '取得記錄失敗' } },
      { status: 500 }
    )
  }
}
```

## 驗收標準

### 功能驗收
- [ ] 用戶可點擊預設按鈕（250ml / 350ml / 500ml）快速記錄
- [ ] 用戶可自訂輸入容量（1-2000ml）
- [ ] 用戶可查看最近 5 次使用的容量快捷按鈕
- [ ] 用戶可刪除錯誤的記錄
- [ ] 記錄成功後顯示 Toast 通知
- [ ] 記錄失敗後顯示錯誤訊息

### 效能驗收
- [ ] 點擊按鈕到 UI 回饋 < 100ms
- [ ] API 回應時間 < 200ms (p95)
- [ ] 同時添加多筆記錄不會出現競態條件

### UX 驗收
- [ ] 按鈕點擊有視覺回饋（scale 動畫）
- [ ] 載入狀態時按鈕 disabled
- [ ] 自訂輸入支援數字鍵盤（mobile）
- [ ] Toast 通知自動消失（3秒）

### 資料驗證
- [ ] 容量必須為正整數
- [ ] 容量範圍 1-2000ml
- [ ] Timestamp 格式正確（ISO 8601）
- [ ] 未認證用戶無法記錄

## 測試策略

### 單元測試
- Zustand store actions 測試
- 資料驗證邏輯測試
- 容量計算工具測試

### 整合測試
- API 端點測試（POST, GET, DELETE）
- 認證中介層測試
- 資料庫查詢測試

### E2E 測試
- 完整快速記錄流程
- 自訂容量輸入流程
- 歷史快捷使用流程
- 錯誤處理流程

## 依賴關係
- **前置條件**: user-authentication（需要 Session）
- **後續依賴**: water-visualization（顯示進度）、goal-management（計算達成率）

## 參考文件
- FillUp! Product Overview: `.kiro/steering/product.md` (核心功能 3: 快速容量輸入)
- FillUp! Tech Stack: `.kiro/steering/tech.md`
- FillUp! Project Structure: `.kiro/steering/structure.md`
