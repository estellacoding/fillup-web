# Water Visualization Spec

## 功能概述
實現 FillUp! 的核心視覺化功能 - 大型水桶圖示與流暢的填充動畫，提供即時、直覺的進度視覺化，讓用戶一眼掌握飲水狀態。

## 用戶旅程

### 主要旅程（P0）
1. **查看水桶進度**
   - 用戶進入主頁面
   - 看到大型水桶圖示，配合刻度標記
   - 水位高度對應當前進度（例：59.5% 填充）
   - 顯著展示「1250ml / 2100ml」與「59.5%」

2. **觀看填充動畫**
   - 用戶點擊「+250ml」按鈕
   - 水桶從 59.5% 流暢上升至 71.4%
   - 動畫持續約 800ms，配合水波紋效果
   - 完成後顯示新的進度數字

3. **達成目標慶祝**
   - 用戶添加最後一筆記錄達到 100%
   - 水桶填滿並觸發慶祝動畫（閃爍、粒子效果）
   - 顯示「恭喜達成今日目標！」訊息

## 技術要求

### 技術棧（參考 tech.md）
- **動畫引擎**: Framer Motion
- **圖形渲染**: SVG + CSS
- **狀態管理**: Zustand (整合 waterStore + goalStore)
- **UI 框架**: React 18+ with Next.js 14

### 效能要求
- 動畫幀率維持 60 FPS
- 首次渲染時間 < 300ms
- 動畫觸發延遲 < 50ms
- 使用 GPU 加速（transform + opacity）

### 設計規範
- 水桶尺寸：320px (width) × 480px (height) @ mobile
- 刻度間距：每 20% 一個主刻度
- 水位顏色：漸層藍色 (#3B82F6 → #60A5FA)
- 動畫曲線：easeInOut
- 動畫時長：800ms

## 組件結構（參考 structure.md）

```
app/
├── (dashboard)/
│   └── page.tsx              # 主頁面（包含 WaterBucket）
│
components/
├── features/
│   └── water-bucket/
│       ├── WaterBucket.tsx       # 主要水桶組件
│       ├── WaterLevel.tsx        # 水位層組件
│       ├── WaterScale.tsx        # 刻度標記組件
│       ├── FillAnimation.tsx     # 填充動畫邏輯
│       └── CelebrationEffect.tsx # 慶祝效果
│
lib/
└── utils/
    └── animation.ts          # 動畫工具函數
```

## 實作細節

### 1. WaterBucket 主組件 (components/features/water-bucket/WaterBucket.tsx)
```typescript
'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring } from 'framer-motion'
import { useWaterStore } from '@/lib/stores/waterStore'
import { useGoalStore } from '@/lib/stores/goalStore'
import { WaterLevel } from './WaterLevel'
import { WaterScale } from './WaterScale'
import { CelebrationEffect } from './CelebrationEffect'

export function WaterBucket() {
  const { todayTotal } = useWaterStore()
  const { goal } = useGoalStore()
  const [showCelebration, setShowCelebration] = useState(false)

  const targetAmount = goal?.targetAmount || 2100
  const progress = Math.min((todayTotal / targetAmount) * 100, 100)

  // 使用 Spring 動畫實現流暢填充
  const animatedProgress = useSpring(0, {
    stiffness: 100,
    damping: 30,
    mass: 1
  })

  useEffect(() => {
    animatedProgress.set(progress)

    // 達成目標時觸發慶祝
    if (progress >= 100 && todayTotal > 0) {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }, [progress, animatedProgress, todayTotal])

  return (
    <div className="relative flex flex-col items-center justify-center p-6">
      {/* 進度數字 */}
      <div className="mb-4 text-center">
        <p className="text-5xl font-bold text-blue-600">
          {Math.round(progress)}%
        </p>
        <p className="mt-2 text-lg text-gray-600">
          {todayTotal}ml / {targetAmount}ml
        </p>
      </div>

      {/* 水桶容器 */}
      <div className="relative w-80 h-[480px]">
        {/* 水桶外框 */}
        <svg
          viewBox="0 0 320 480"
          className="absolute inset-0 w-full h-full"
        >
          {/* 水桶形狀 */}
          <path
            d="M 60 480 L 40 80 Q 40 40, 80 40 L 240 40 Q 280 40, 280 80 L 260 480 Z"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="4"
            className="drop-shadow-lg"
          />

          {/* 水桶底部 */}
          <ellipse
            cx="160"
            cy="480"
            rx="100"
            ry="20"
            fill="#F3F4F6"
            stroke="#E5E7EB"
            strokeWidth="2"
          />
        </svg>

        {/* 刻度標記 */}
        <WaterScale />

        {/* 水位 */}
        <WaterLevel progress={animatedProgress} />

        {/* 慶祝效果 */}
        {showCelebration && <CelebrationEffect />}
      </div>

      {/* 狀態訊息 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 text-center"
      >
        {progress >= 100 ? (
          <p className="text-xl font-semibold text-green-600">
            🎉 恭喜達成今日目標！
          </p>
        ) : progress >= 80 ? (
          <p className="text-lg text-blue-600">快達標了！加油</p>
        ) : progress >= 50 ? (
          <p className="text-lg text-gray-600">進度良好，繼續保持</p>
        ) : (
          <p className="text-lg text-gray-500">今天也要記得喝水喔</p>
        )}
      </motion.div>
    </div>
  )
}
```

### 2. WaterLevel 組件 (components/features/water-bucket/WaterLevel.tsx)
```typescript
'use client'

import { motion, MotionValue } from 'framer-motion'

interface WaterLevelProps {
  progress: MotionValue<number>
}

export function WaterLevel({ progress }: WaterLevelProps) {
  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 overflow-hidden"
      style={{
        height: progress.get() > 0 ? '100%' : '0%'
      }}
    >
      <svg
        viewBox="0 0 320 480"
        className="absolute inset-0 w-full h-full"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* 水位漸層 */}
          <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.8" />
          </linearGradient>

          {/* 水波紋遮罩 */}
          <clipPath id="waterClip">
            <motion.rect
              x="40"
              y="0"
              width="240"
              rx="20"
              style={{
                height: progress,
                y: progress.get() > 0
                  ? `${480 - (480 * progress.get()) / 100}px`
                  : '480px'
              }}
            />
          </clipPath>
        </defs>

        {/* 水位主體 */}
        <motion.path
          d="M 60 480 L 40 80 Q 40 40, 80 40 L 240 40 Q 280 40, 280 80 L 260 480 Z"
          fill="url(#waterGradient)"
          clipPath="url(#waterClip)"
          style={{
            transformOrigin: 'center bottom'
          }}
        />

        {/* 水波紋效果 */}
        <motion.ellipse
          cx="160"
          cy="480"
          rx="100"
          ry="20"
          fill="#3B82F6"
          opacity="0.6"
          animate={{
            scaleX: [1, 1.1, 1],
            scaleY: [1, 0.9, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            transformOrigin: '160px 480px',
            y: `${480 - (480 * progress.get()) / 100}px`
          }}
        />
      </svg>
    </motion.div>
  )
}
```

### 3. WaterScale 組件 (components/features/water-bucket/WaterScale.tsx)
```typescript
'use client'

export function WaterScale() {
  const scales = [0, 20, 40, 60, 80, 100]

  return (
    <div className="absolute inset-0 pointer-events-none">
      {scales.map((percent) => {
        const y = 480 - (480 * percent) / 100

        return (
          <div
            key={percent}
            className="absolute left-0 right-0 flex items-center"
            style={{ top: `${y}px` }}
          >
            {/* 刻度線 */}
            <div className="w-8 h-0.5 bg-gray-300" />

            {/* 刻度標籤 */}
            <span className="ml-2 text-sm text-gray-500 font-medium">
              {percent}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
```

### 4. CelebrationEffect 組件 (components/features/water-bucket/CelebrationEffect.tsx)
```typescript
'use client'

import { motion } from 'framer-motion'

export function CelebrationEffect() {
  const confetti = Array.from({ length: 20 }, (_, i) => i)

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {confetti.map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: ['#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'][i % 4],
            left: `${Math.random() * 100}%`,
            top: '0%'
          }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{
            y: 500,
            opacity: 0,
            scale: 0.5,
            rotate: Math.random() * 360
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: Math.random() * 0.5,
            ease: 'easeOut'
          }}
        />
      ))}

      {/* 閃爍效果 */}
      <motion.div
        className="absolute inset-0 bg-blue-400 rounded-full blur-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 1.5, repeat: 2 }}
      />
    </div>
  )
}
```

## 驗收標準

### 功能驗收
- [ ] 水桶正確顯示當前進度百分比
- [ ] 水位高度對應進度（0% = 空，100% = 滿）
- [ ] 刻度標記正確顯示（0%, 20%, 40%, 60%, 80%, 100%）
- [ ] 添加飲水記錄時觸發填充動畫
- [ ] 達成 100% 時觸發慶祝效果

### 動畫驗收
- [ ] 填充動畫流暢（60 FPS）
- [ ] 動畫時長約 800ms
- [ ] 使用 easeInOut 曲線
- [ ] 慶祝動畫包含粒子效果
- [ ] 動畫不阻塞主執行緒

### 視覺驗收
- [ ] 水位使用藍色漸層
- [ ] 水桶外框清晰可見
- [ ] 刻度標記對齊水位
- [ ] 響應式設計（mobile / desktop）
- [ ] 暗黑模式支援（Phase 2）

### 效能驗收
- [ ] 首次渲染 < 300ms
- [ ] 動畫觸發延遲 < 50ms
- [ ] 使用 GPU 加速
- [ ] 無記憶體洩漏

## 測試策略

### 單元測試
- 進度百分比計算
- 水位高度轉換

### 視覺測試
- Storybook 組件展示
- 不同進度狀態快照測試

### E2E 測試
- 完整填充動畫流程
- 達成目標慶祝流程
- 多次連續添加測試

## 依賴關係
- **前置條件**: water-logging（提供飲水記錄）、goal-management（提供目標設定）
- **後續依賴**: achievement-system（100% 完成後觸發成就）

## 參考文件
- FillUp! Product Overview: `.kiro/steering/product.md` (核心功能 1: 視覺化水桶進度)
- FillUp! Tech Stack: `.kiro/steering/tech.md`
- Framer Motion 文件: https://www.framer.com/motion/
