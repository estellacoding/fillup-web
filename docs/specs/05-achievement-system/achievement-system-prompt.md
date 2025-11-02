# Achievement System Spec

## 功能概述
實現 FillUp! 的遊戲化激勵引擎，包含成就系統、徽章收集、慶祝動畫，讓用戶在達成里程碑時獲得正向回饋，建立持久的健康習慣。

## 用戶旅程

### 主要旅程（P0）
1. **解鎖首次成就**
   - 用戶首次達成每日目標
   - 觸發慶祝動畫與音效
   - 彈出「新成就解鎖」Modal
   - 顯示徽章圖示與描述
   - 用戶可分享或關閉

2. **查看成就列表**
   - 用戶進入成就頁面
   - 看到所有成就分類（已解鎖 / 未解鎖）
   - 已解鎖：彩色徽章 + 解鎖日期
   - 未解鎖：灰色徽章 + 達成條件

3. **追蹤連續天數**
   - 用戶連續 3 天達成目標
   - 解鎖「3 日連勝」徽章
   - 顯示當前連續天數
   - 鼓勵繼續挑戰更高里程碑

## 技術要求

### 技術棧（參考 tech.md）
- **前端框架**: React 18+ with Next.js 14
- **狀態管理**: Zustand (achievementStore)
- **動畫**: Framer Motion
- **UI 組件**: shadcn/ui + Tailwind CSS
- **資料庫**: PostgreSQL + Prisma ORM

### 成就類型定義
```typescript
type AchievementType =
  | 'first-goal'        // 首次達標
  | 'streak-3'          // 連續 3 天
  | 'streak-7'          // 連續 7 天
  | 'streak-30'         // 連續 30 天
  | 'perfect-week'      // 完美週（7 天全達標）
  | 'milestone-10'      // 累積達標 10 次
  | 'milestone-50'      // 累積達標 50 次
  | 'milestone-100'     // 累積達標 100 次
  | 'early-bird'        // 早起喝水（9:00 前達標）
  | 'night-owl'         // 夜貓子（22:00 後仍達標）
```

## 資料模型（參考 structure.md）

### Achievement Model
```prisma
model Achievement {
  id          String   @id @default(cuid())
  type        String   @unique
  name        String
  description String
  badgeUrl    String
  criteria    Json     // 達成條件 (JSON)
  points      Int      @default(0)
  createdAt   DateTime @default(now())

  userAchievements UserAchievement[]
}

model UserAchievement {
  id            String   @id @default(cuid())
  userId        String
  achievementId String
  unlockedAt    DateTime @default(now())

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement Achievement @relation(fields: [achievementId], references: [id])

  @@unique([userId, achievementId])
  @@index([userId])
}
```

### TypeScript Types
```typescript
// types/achievement.ts
export interface Achievement {
  id: string
  type: string
  name: string
  description: string
  badgeUrl: string
  criteria: Record<string, any>
  points: number
  createdAt: Date
}

export interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  unlockedAt: Date
  achievement: Achievement
}

export interface AchievementProgress {
  achievement: Achievement
  isUnlocked: boolean
  unlockedAt?: Date
  progress?: {
    current: number
    target: number
    percentage: number
  }
}
```

## API 端點

```
GET    /api/achievements              # 取得所有成就定義
GET    /api/achievements/user         # 取得用戶成就進度
POST   /api/achievements/check        # 檢查並解鎖成就（內部 API）
GET    /api/achievements/stats        # 取得成就統計
```

## 組件結構（參考 structure.md）

```
app/
├── (dashboard)/
│   └── achievements/
│       └── page.tsx              # 成就頁面
│
├── api/
│   └── achievements/
│       ├── route.ts              # GET /api/achievements
│       ├── user/
│       │   └── route.ts          # GET /api/achievements/user
│       ├── check/
│       │   └── route.ts          # POST /api/achievements/check
│       └── stats/
│           └── route.ts          # GET /api/achievements/stats
│
components/
├── features/
│   └── achievements/
│       ├── BadgeGrid.tsx             # 徽章網格
│       ├── BadgeCard.tsx             # 單個徽章卡片
│       ├── CelebrationModal.tsx      # 慶祝 Modal
│       ├── AchievementToast.tsx      # 成就解鎖 Toast
│       └── ProgressRing.tsx          # 進度環
│
lib/
├── stores/
│   └── achievementStore.ts       # 成就狀態管理
├── hooks/
│   └── useAchievements.ts        # 成就 Hook
└── utils/
    └── achievement.ts            # 成就檢查邏輯
```

## 實作細節

### 1. 成就定義 (lib/constants/achievements.ts)
```typescript
export const ACHIEVEMENTS = [
  {
    type: 'first-goal',
    name: '初次達標',
    description: '首次完成每日飲水目標',
    badgeUrl: '/images/badges/first-goal.svg',
    points: 10,
    criteria: {
      type: 'goal-completion',
      count: 1
    }
  },
  {
    type: 'streak-3',
    name: '3 日連勝',
    description: '連續 3 天達成目標',
    badgeUrl: '/images/badges/streak-3.svg',
    points: 30,
    criteria: {
      type: 'streak',
      days: 3
    }
  },
  {
    type: 'streak-7',
    name: '一週勇者',
    description: '連續 7 天達成目標',
    badgeUrl: '/images/badges/streak-7.svg',
    points: 70,
    criteria: {
      type: 'streak',
      days: 7
    }
  },
  {
    type: 'perfect-week',
    name: '完美週',
    description: '本週 7 天全部達標',
    badgeUrl: '/images/badges/perfect-week.svg',
    points: 100,
    criteria: {
      type: 'perfect-week'
    }
  },
  // ... 更多成就定義
]
```

### 2. 成就檢查工具 (lib/utils/achievement.ts)
```typescript
import { prisma } from '@/lib/db/prisma'

/**
 * 檢查並解鎖成就
 */
export async function checkAndUnlockAchievements(userId: string) {
  const unlockedAchievements: string[] = []

  // 取得用戶已解鎖的成就
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true }
  })

  const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId))

  // 檢查每個成就
  for (const achievement of ACHIEVEMENTS) {
    // 跳過已解鎖的成就
    if (unlockedIds.has(achievement.id)) continue

    const shouldUnlock = await checkAchievementCriteria(userId, achievement.criteria)

    if (shouldUnlock) {
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id
        }
      })
      unlockedAchievements.push(achievement.type)
    }
  }

  return unlockedAchievements
}

/**
 * 檢查成就達成條件
 */
async function checkAchievementCriteria(
  userId: string,
  criteria: Record<string, any>
): Promise<boolean> {
  switch (criteria.type) {
    case 'goal-completion':
      return await checkGoalCompletionCount(userId, criteria.count)

    case 'streak':
      return await checkStreak(userId, criteria.days)

    case 'perfect-week':
      return await checkPerfectWeek(userId)

    default:
      return false
  }
}

/**
 * 檢查達標次數
 */
async function checkGoalCompletionCount(userId: string, targetCount: number): Promise<boolean> {
  const goal = await prisma.goal.findUnique({ where: { userId } })
  if (!goal) return false

  // 計算有多少天達成目標
  const completedDays = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT DATE(timestamp)) as count
    FROM "WaterLog"
    WHERE "userId" = ${userId}
    GROUP BY DATE(timestamp)
    HAVING SUM(amount) >= ${goal.targetAmount}
  `

  return completedDays[0]?.count >= targetCount
}

/**
 * 檢查連續天數
 */
async function checkStreak(userId: string, targetDays: number): Promise<boolean> {
  // 實作連續天數計算邏輯
  // （檢查從今天往回推，連續達標的天數）
  // 簡化版本省略詳細實作
  return false
}

/**
 * 檢查完美週
 */
async function checkPerfectWeek(userId: string): Promise<boolean> {
  // 實作本週 7 天全達標檢查
  return false
}
```

### 3. CelebrationModal 組件 (components/features/achievements/CelebrationModal.tsx)
```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Confetti from 'react-confetti'

interface CelebrationModalProps {
  achievement: {
    name: string
    description: string
    badgeUrl: string
    points: number
  }
  isOpen: boolean
  onClose: () => void
}

export function CelebrationModal({ achievement, isOpen, onClose }: CelebrationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <AnimatePresence>
          {isOpen && (
            <>
              {/* 彩紙效果 */}
              <Confetti
                width={400}
                height={400}
                recycle={false}
                numberOfPieces={200}
              />

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="flex flex-col items-center p-6 space-y-4"
              >
                {/* 徽章圖示 */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <Image
                    src={achievement.badgeUrl}
                    alt={achievement.name}
                    width={120}
                    height={120}
                  />
                </motion.div>

                {/* 成就資訊 */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    新成就解鎖！
                  </h2>
                  <h3 className="text-xl font-semibold text-blue-600">
                    {achievement.name}
                  </h3>
                  <p className="text-gray-600">
                    {achievement.description}
                  </p>
                  <p className="text-lg font-bold text-yellow-600">
                    +{achievement.points} 點數
                  </p>
                </div>

                {/* 按鈕 */}
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1" onClick={onClose}>
                    關閉
                  </Button>
                  <Button className="flex-1">
                    分享成就
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
```

### 4. BadgeCard 組件 (components/features/achievements/BadgeCard.tsx)
```typescript
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import type { AchievementProgress } from '@/types/achievement'
import { format } from 'date-fns'

interface BadgeCardProps {
  achievement: AchievementProgress
}

export function BadgeCard({ achievement }: BadgeCardProps) {
  const isLocked = !achievement.isUnlocked

  return (
    <motion.div
      whileHover={{ scale: isLocked ? 1 : 1.05 }}
      className={`
        relative p-4 rounded-lg border-2 transition-all
        ${isLocked
          ? 'bg-gray-50 border-gray-200 opacity-60'
          : 'bg-white border-blue-200 shadow-md'
        }
      `}
    >
      {/* 徽章圖示 */}
      <div className="flex justify-center mb-3">
        <Image
          src={achievement.achievement.badgeUrl}
          alt={achievement.achievement.name}
          width={80}
          height={80}
          className={isLocked ? 'grayscale' : ''}
        />
      </div>

      {/* 成就資訊 */}
      <div className="text-center space-y-1">
        <h3 className={`font-semibold ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>
          {achievement.achievement.name}
        </h3>
        <p className="text-sm text-gray-600">
          {achievement.achievement.description}
        </p>

        {/* 解鎖日期或進度 */}
        {achievement.isUnlocked ? (
          <p className="text-xs text-green-600 font-medium">
            已於 {format(new Date(achievement.unlockedAt!), 'yyyy/MM/dd')} 解鎖
          </p>
        ) : achievement.progress ? (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${achievement.progress.percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {achievement.progress.current} / {achievement.progress.target}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-400">🔒 未解鎖</p>
        )}
      </div>

      {/* 點數標籤 */}
      <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
        {achievement.achievement.points}pts
      </div>
    </motion.div>
  )
}
```

## 驗收標準

### 功能驗收
- [ ] 用戶達成條件時自動解鎖成就
- [ ] 解鎖時顯示慶祝 Modal
- [ ] 成就頁面正確顯示已解鎖/未解鎖狀態
- [ ] 連續天數正確計算
- [ ] 完美週正確判定

### 動畫驗收
- [ ] 慶祝 Modal 有彩紙效果
- [ ] 徽章有旋轉/縮放動畫
- [ ] Toast 通知流暢顯示

### 資料驗收
- [ ] 成就不會重複解鎖
- [ ] 解鎖時間正確記錄
- [ ] 點數正確累積

## 測試策略

### 單元測試
- `checkAchievementCriteria()` 測試
- `checkStreak()` 測試
- 點數計算測試

### 整合測試
- API 端點測試
- 成就解鎖流程測試

### E2E 測試
- 完整解鎖流程
- 查看成就列表流程

## 依賴關係
- **前置條件**: water-logging（提供飲水記錄）、goal-management（判斷達標）、water-visualization（觸發慶祝）
- **後續依賴**: 無

## 參考文件
- FillUp! Product Overview: `.kiro/steering/product.md` (核心功能 4: 遊戲化激勵引擎)
- FillUp! Tech Stack: `.kiro/steering/tech.md`
