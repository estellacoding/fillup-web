# Smart Reminders Spec

## 功能概述
實現 FillUp! 的智慧提醒系統，學習用戶習慣並最佳化提醒時機，尊重專注時段與睡眠時間，透過推播通知附帶激勵訊息鼓勵用戶喝水。

## 用戶旅程

### 主要旅程（P0）
1. **設定提醒偏好**
   - 用戶進入提醒設定頁面
   - 啟用/停用提醒功能
   - 設定提醒間隔（例：每 2 小時）
   - 設定免打擾時段（例：22:00-08:00）
   - 儲存設定

2. **接收智慧提醒**
   - 系統在適當時機發送推播通知
   - 通知內容：「該喝水囉！今天已完成 45%」
   - 用戶點擊通知直接進入 App 快速記錄

3. **學習優化（Phase 2）**
   - 系統分析用戶喝水習慣
   - 自動調整提醒時機
   - 在用戶最常喝水的時段前提醒

## 技術要求

### 技術棧（參考 tech.md）
- **推送服務**: Web Push API + Service Worker
- **備選方案**: OneSignal / Firebase Cloud Messaging
- **排程**: Cron Job（Vercel Cron Functions）
- **儲存**: PostgreSQL (Reminder 設定)

### Phase 1 功能
- 固定間隔提醒
- 免打擾時段
- 基本推播通知
- 手動啟用/停用

### Phase 2 功能（未來）
- 智慧學習用戶習慣
- 動態調整提醒時機
- 個性化激勵訊息
- A/B 測試最佳提醒策略

## 資料模型

### ReminderSettings Model
```prisma
model ReminderSettings {
  id                String   @id @default(cuid())
  userId            String   @unique
  enabled           Boolean  @default(true)
  intervalMinutes   Int      @default(120)  // 提醒間隔（分鐘）
  quietStartTime    String   @default("22:00")  // 免打擾開始時間
  quietEndTime      String   @default("08:00")  // 免打擾結束時間
  pushSubscription  Json?    // Web Push subscription
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model ReminderLog {
  id         String   @id @default(cuid())
  userId     String
  sentAt     DateTime @default(now())
  message    String
  clicked    Boolean  @default(false)
  clickedAt  DateTime?

  @@index([userId, sentAt])
}
```

### TypeScript Types
```typescript
// types/reminder.ts
export interface ReminderSettings {
  id: string
  userId: string
  enabled: boolean
  intervalMinutes: number
  quietStartTime: string
  quietEndTime: string
  pushSubscription: PushSubscription | null
  createdAt: Date
  updatedAt: Date
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: Record<string, any>
}
```

## API 端點

```
GET    /api/reminders/settings        # 取得提醒設定
PUT    /api/reminders/settings        # 更新提醒設定
POST   /api/reminders/subscribe       # 訂閱推播通知
POST   /api/reminders/unsubscribe     # 取消訂閱
POST   /api/reminders/test            # 發送測試通知
```

## 組件結構（參考 structure.md）

```
app/
├── (dashboard)/
│   └── settings/
│       └── reminders/
│           └── page.tsx          # 提醒設定頁面
│
├── api/
│   └── reminders/
│       ├── settings/
│       │   └── route.ts          # GET, PUT /api/reminders/settings
│       ├── subscribe/
│       │   └── route.ts          # POST /api/reminders/subscribe
│       ├── unsubscribe/
│       │   └── route.ts
│       └── test/
│           └── route.ts
│
├── api/cron/
│   └── send-reminders/
│       └── route.ts              # Cron job 發送提醒
│
components/
├── features/
│   └── reminders/
│       ├── ReminderConfig.tsx        # 提醒設定表單
│       ├── QuietTimeSelector.tsx     # 免打擾時段選擇器
│       └── PushPermission.tsx        # 推播權限請求
│
public/
└── service-worker.js             # Service Worker
```

## 實作細節

### 1. Service Worker (public/service-worker.js)
```javascript
// 監聽推播通知
self.addEventListener('push', function(event) {
  const data = event.data.json()

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    data: data.data || {},
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'log',
        title: '快速記錄 250ml'
      },
      {
        action: 'open',
        title: '開啟 App'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// 處理通知點擊
self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  if (event.action === 'log') {
    // 快速記錄 250ml（透過 Background Sync）
    event.waitUntil(
      clients.openWindow('/api/water?quick=250')
    )
  } else {
    // 開啟 App
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
```

### 2. ReminderConfig 組件 (components/features/reminders/ReminderConfig.tsx)
```typescript
'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QuietTimeSelector } from './QuietTimeSelector'
import { PushPermission } from './PushPermission'
import { toast } from 'sonner'

export function ReminderConfig() {
  const [enabled, setEnabled] = useState(true)
  const [intervalMinutes, setIntervalMinutes] = useState(120)
  const [quietStartTime, setQuietStartTime] = useState('22:00')
  const [quietEndTime, setQuietEndTime] = useState('08:00')
  const [hasPermission, setHasPermission] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // 載入設定
    fetch('/api/reminders/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEnabled(data.data.enabled)
          setIntervalMinutes(data.data.intervalMinutes)
          setQuietStartTime(data.data.quietStartTime)
          setQuietEndTime(data.data.quietEndTime)
        }
      })

    // 檢查推播權限
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted')
    }
  }, [])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/reminders/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          intervalMinutes,
          quietStartTime,
          quietEndTime
        })
      })

      if (!response.ok) throw new Error('儲存失敗')

      toast.success('提醒設定已更新')
    } catch (error) {
      toast.error('儲存失敗，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestNotification = async () => {
    try {
      await fetch('/api/reminders/test', { method: 'POST' })
      toast.success('測試通知已發送')
    } catch (error) {
      toast.error('發送失敗')
    }
  }

  return (
    <div className="space-y-6">
      {/* 推播權限 */}
      {!hasPermission && (
        <PushPermission onGranted={() => setHasPermission(true)} />
      )}

      {/* 啟用提醒 */}
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="enabled">啟用提醒</Label>
          <p className="text-sm text-gray-500">定時推播提醒您喝水</p>
        </div>
        <Switch
          id="enabled"
          checked={enabled}
          onCheckedChange={setEnabled}
          disabled={!hasPermission}
        />
      </div>

      {/* 提醒間隔 */}
      <div>
        <Label htmlFor="interval">提醒間隔</Label>
        <div className="flex items-center gap-2 mt-2">
          <Input
            id="interval"
            type="number"
            value={intervalMinutes}
            onChange={(e) => setIntervalMinutes(parseInt(e.target.value))}
            min={30}
            max={480}
            step={30}
            disabled={!enabled}
          />
          <span className="text-gray-600">分鐘</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">建議：60-180 分鐘</p>
      </div>

      {/* 免打擾時段 */}
      <QuietTimeSelector
        startTime={quietStartTime}
        endTime={quietEndTime}
        onStartChange={setQuietStartTime}
        onEndChange={setQuietEndTime}
        disabled={!enabled}
      />

      {/* 按鈕 */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isLoading || !hasPermission}>
          {isLoading ? '儲存中...' : '儲存設定'}
        </Button>
        <Button
          variant="outline"
          onClick={handleTestNotification}
          disabled={!hasPermission || !enabled}
        >
          測試通知
        </Button>
      </div>
    </div>
  )
}
```

### 3. Cron Job 發送提醒 (app/api/cron/send-reminders/route.ts)
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import webpush from 'web-push'

// 設定 VAPID keys
webpush.setVapidDetails(
  'mailto:support@fillup.app',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function GET(request: Request) {
  try {
    // 驗證 Cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`

    // 取得所有啟用提醒的用戶
    const settings = await prisma.reminderSettings.findMany({
      where: {
        enabled: true,
        pushSubscription: { not: null }
      },
      include: {
        user: {
          include: {
            goal: true
          }
        }
      }
    })

    let sentCount = 0

    for (const setting of settings) {
      // 檢查是否在免打擾時段
      if (isInQuietTime(currentTime, setting.quietStartTime, setting.quietEndTime)) {
        continue
      }

      // 檢查上次提醒時間
      const lastReminder = await prisma.reminderLog.findFirst({
        where: { userId: setting.userId },
        orderBy: { sentAt: 'desc' }
      })

      if (lastReminder) {
        const minutesSinceLastReminder = (now.getTime() - lastReminder.sentAt.getTime()) / 1000 / 60
        if (minutesSinceLastReminder < setting.intervalMinutes) {
          continue
        }
      }

      // 取得今日進度
      const todayLogs = await prisma.waterLog.findMany({
        where: {
          userId: setting.userId,
          timestamp: {
            gte: new Date(now.setHours(0, 0, 0, 0))
          }
        }
      })

      const todayTotal = todayLogs.reduce((sum, log) => sum + log.amount, 0)
      const goalAmount = setting.user.goal?.targetAmount || 2100
      const progress = Math.min(Math.round((todayTotal / goalAmount) * 100), 100)

      // 發送推播
      const payload = JSON.stringify({
        title: '該喝水囉！💧',
        body: `今天已完成 ${progress}%，繼續保持！`,
        icon: '/icon-192x192.png',
        data: {
          url: '/',
          progress
        }
      })

      try {
        await webpush.sendNotification(
          setting.pushSubscription as any,
          payload
        )

        // 記錄提醒
        await prisma.reminderLog.create({
          data: {
            userId: setting.userId,
            message: payload
          }
        })

        sentCount++
      } catch (error) {
        console.error('Failed to send notification:', error)
      }
    }

    return NextResponse.json({
      success: true,
      sentCount
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

function isInQuietTime(current: string, start: string, end: string): boolean {
  // 簡化版本：假設 start 總是晚於 end（跨日）
  if (start > end) {
    return current >= start || current < end
  }
  return current >= start && current < end
}
```

## 環境變數

```env
# Web Push (VAPID)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Cron Secret (Vercel)
CRON_SECRET=your-cron-secret
```

## Vercel Cron 配置

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

## 驗收標準

### 功能驗收
- [ ] 用戶可設定提醒間隔
- [ ] 用戶可設定免打擾時段
- [ ] 推播通知正確發送
- [ ] 免打擾時段不發送通知
- [ ] 點擊通知可開啟 App

### 推播驗收
- [ ] 請求推播權限流程順暢
- [ ] 通知內容顯示正確
- [ ] 通知包含當前進度
- [ ] 快速記錄功能可用（Phase 2）

### 效能驗收
- [ ] Cron job 執行時間 < 10 秒
- [ ] 通知發送成功率 > 95%

## 測試策略

### 單元測試
- `isInQuietTime()` 測試
- 提醒間隔計算測試

### 整合測試
- Web Push API 整合測試
- Cron job 執行測試

### E2E 測試
- 完整提醒設定流程
- 推播權限請求流程

## 依賴關係
- **前置條件**: user-authentication（需要用戶）、goal-management（計算進度）
- **後續依賴**: 無

## Phase 2 改進方向
- 機器學習預測最佳提醒時機
- 個性化激勵訊息（根據成就、進度生成）
- A/B 測試不同提醒策略
- 整合日曆避免會議時段

## 參考文件
- FillUp! Product Overview: `.kiro/steering/product.md` (核心功能 6: 智慧提醒)
- Web Push API: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
