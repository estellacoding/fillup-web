---
title: Project Structure
inclusion: always
---

# 專案架構
## 整體架構概觀
FillUp! 採用 前後端分離：
```
frontend/  ← React + Vite + Tailwind（PWA、Web Push、Recharts、Framer Motion、Zustand）
backend/   ← FastAPI + PostgreSQL（REST + WebSocket）
infra/     ← AWS（S3/CloudFront/Lambda 或 EC2）+ GitHub Actions（CI/CD）
```
核心流： 使用者操作 → 前端 store 狀態更新 → 動畫呈現 →（必要時）呼叫 REST → 後端持久化 → WebSocket/輪詢回推關鍵變更。


## 前端檔案結構
frontend/
├── src/
│   ├── assets/                      # 圖示/圖片/音效
│   ├── components/                  # 純視圖或小型可重複元件
│   │   ├── BucketVisualizer.tsx     # 水桶填充動畫
│   │   ├── QuickInputButtons.tsx    # 快速容量按鈕（250/350/500）
│   │   ├── AchievementBadge.tsx     # 成就徽章顯示
│   │   ├── NotificationCard.tsx     # 提醒/激勵訊息
│   │   └── DashboardChart.tsx       # Recharts 趨勢圖
│   ├── pages/                       # Page 級路由
│   │   ├── Home.tsx                 # 主畫面：填充 + 快速記錄
│   │   ├── Stats.tsx                # 統計（每日/週/月）
│   │   ├── Settings.tsx             # 目標/時段/單位
│   │   └── Achievements.tsx         # 成就/徽章列表
│   ├── store/                       # Zustand 全域狀態
│   │   ├── useHydrationStore.ts
│   │   ├── useSettingsStore.ts
│   │   └── useAchievementStore.ts
│   ├── services/                    # API/WS 封裝（副作用集中）
│   │   ├── http.ts                  # axios/base fetch 設定、攔截器
│   │   ├── hydration.service.ts
│   │   ├── goals.service.ts
│   │   ├── badges.service.ts
│   │   └── stats.service.ts
│   ├── hooks/                       # 自訂 Hook（通知/PWA/快取策略）
│   │   ├── useNotifications.ts
│   │   └── usePWA.ts
│   ├── utils/                       # 工具：時間/格式/單位轉換
│   │   ├── time.ts
│   │   ├── format.ts
│   │   └── units.ts
│   ├── styles/                      # 全域樣式（若有）
│   │   └── index.css
│   ├── app/                         # 路由/配置（選用 React Router）
│   │   └── router.tsx
│   ├── App.tsx
│   └── main.tsx
├── public/                          # favicon、manifest、icons
├── index.html
├── vite.config.ts
└── tsconfig.json


## 後端檔案結構

backend/
├── app/
│   ├── main.py                      # FastAPI 入口
│   ├── api/
│   │   ├── routes/
│   │   │   ├── hydration.py         # 飲水紀錄 CRUD
│   │   │   ├── goals.py             # 目標設定 CRUD
│   │   │   ├── badges.py            # 徽章查詢 / 授予
│   │   │   └── stats.py             # 統計（每日/週/月）
│   │   └── deps.py                  # DI（auth/db/rate-limit 等）
│   ├── core/
│   │   ├── config.py                # 環境變數/設定
│   │   ├── database.py              # SQLAlchemy 連線
│   │   └── security.py              # JWT / OAuth（若啟用）
│   ├── models/                      # SQLAlchemy 模型
│   │   ├── user.py
│   │   ├── hydration.py
│   │   ├── goal.py
│   │   └── badge.py
│   ├── schemas/                     # Pydantic schema
│   │   ├── user.py
│   │   ├── hydration.py
│   │   ├── goal.py
│   │   └── badge.py
│   ├── services/                    # 商業邏輯（提醒/徽章）
│   │   ├── reminder_service.py
│   │   └── badge_service.py
│   └── utils/
│       ├── ai_messages.py           # 個人化激勵訊息（選配）
│       └── timebox.py               # 時段/提醒計算
├── tests/
│   ├── api/
│   └── services/
├── requirements.txt
└── alembic/                         # DB migration（若使用）

