# FillUp! Specs 總覽

本目錄包含 FillUp! 專案的所有功能規格文件（Specs），每個 Spec 對應一個端到端的最小可交付流程，遵循單一責任原則，確保清楚的邊界、可並行開發與測試。

## 📁 Specs 結構（按開發順序）

```
docs/specs/
├── README.md                                    # 本文件
├── 01-user-authentication/                      # 1️⃣ 用戶認證（基礎）
│   └── user-authentication-prompt.md
├── 02-goal-management/                          # 2️⃣ 目標管理（核心）
│   └── goal-management-prompt.md
├── 03-water-logging/                            # 3️⃣ 飲水記錄核心
│   └── water-logging-prompt.md
├── 04-water-visualization/                      # 4️⃣ 水桶視覺化
│   └── water-visualization-prompt.md
├── 05-achievement-system/                       # 5️⃣ 成就系統
│   └── achievement-system-prompt.md
├── 06-stats-dashboard/                          # 6️⃣ 統計儀表板
│   └── stats-dashboard-prompt.md
└── 07-smart-reminders/                          # 7️⃣ 智慧提醒
    └── smart-reminders-prompt.md
```

## 🎯 Specs 功能切分（按開發順序）

### 1️⃣ User Authentication (用戶認證)
**檔案**: `01-user-authentication/user-authentication-prompt.md`
**核心功能**: 註冊、登入、登出
**用戶旅程**:
- 新用戶註冊 → 設定初始目標 → 進入主頁面
- 現有用戶登入 → 導向儀表板

**技術重點**: NextAuth.js, Email/Password + Google OAuth
**優先級**: P0（所有功能的基礎）
**預估時間**: 3-5 天
**依賴**: 無

---

### 2️⃣ Goal Management (目標管理)
**檔案**: `02-goal-management/goal-management-prompt.md`
**核心功能**: 設定每日目標、活動時段、計算進度
**用戶旅程**:
- 首次設定目標 → 自訂水量與時段 → 儲存
- 調整目標 → 立即生效

**技術重點**: 進度計算演算法, 時間驗證
**優先級**: P0（進度追蹤基礎）
**預估時間**: 3-4 天
**依賴**: user-authentication

---

### 3️⃣ Water Logging (飲水記錄核心)
**檔案**: `03-water-logging/water-logging-prompt.md`
**核心功能**: 快速容量輸入、自訂輸入、歷史記錄快捷
**用戶旅程**:
- 點擊預設按鈕（250ml/350ml/500ml）→ 即時記錄 → Toast 通知
- 自訂容量輸入 → 驗證 → 保存

**技術重點**: Zustand 狀態管理, Zod 驗證, Prisma ORM
**優先級**: P0（核心功能）
**預估時間**: 4-6 天
**依賴**: user-authentication

---

### 4️⃣ Water Visualization (水桶視覺化)
**檔案**: `04-water-visualization/water-visualization-prompt.md`
**核心功能**: 大型水桶圖示、填充動畫、達標慶祝
**用戶旅程**:
- 查看即時進度 → 添加飲水 → 觀看流暢動畫
- 達成 100% → 慶祝效果

**技術重點**: Framer Motion, SVG 動畫, GPU 加速
**優先級**: P0（視覺化核心）
**預估時間**: 5-7 天
**依賴**: water-logging, goal-management

---

### 5️⃣ Achievement System (成就系統)
**檔案**: `05-achievement-system/achievement-system-prompt.md`
**核心功能**: 成就解鎖、徽章收集、慶祝動畫
**用戶旅程**:
- 達成里程碑 → 解鎖徽章 → 慶祝 Modal
- 查看成就列表 → 追蹤進度

**技術重點**: 成就檢查演算法, 動畫效果
**優先級**: P1（遊戲化增強）
**預估時間**: 4-6 天
**依賴**: water-logging, goal-management, water-visualization

---

### 6️⃣ Stats Dashboard (統計儀表板)
**檔案**: `06-stats-dashboard/stats-dashboard-prompt.md`
**核心功能**: 每日/每週/每月統計、視覺化圖表、洞察分析
**用戶旅程**:
- 查看每日統計 → 切換週/月視圖 → 分析趨勢
- 獲得洞察建議

**技術重點**: Recharts, 資料聚合, 洞察演算法
**優先級**: P1（數據分析）
**預估時間**: 5-7 天
**依賴**: water-logging, goal-management

---

### 7️⃣ Smart Reminders (智慧提醒)
**檔案**: `07-smart-reminders/smart-reminders-prompt.md`
**核心功能**: 推播通知、免打擾時段、學習習慣（Phase 2）
**用戶旅程**:
- 設定提醒偏好 → 接收推播 → 快速記錄
- 系統學習最佳提醒時機

**技術重點**: Web Push API, Service Worker, Cron Jobs
**優先級**: P2（習慣養成增強）
**預估時間**: 6-8 天
**依賴**: water-logging, goal-management

---

## 🔄 建議開發順序

### Phase 1: MVP 核心功能（4-6 週）
```
Week 1:     01-user-authentication (登入/註冊系統)
Week 2:     02-goal-management (目標設定)
Week 3-4:   03-water-logging (飲水記錄)
Week 4-5:   04-water-visualization (水桶動畫)
Week 6:     整合測試 + Bug 修復 + 部署
```

### Phase 2: 遊戲化與分析（3-4 週）
```
Week 7-8:   05-achievement-system (成就系統)
Week 9-10:  06-stats-dashboard (統計儀表板)
```

### Phase 3: 習慣養成增強（2-3 週）
```
Week 11-13: 07-smart-reminders (智慧提醒)
```

## 📊 依賴關係圖

```
01-user-authentication (基礎，無依賴)
    │
    ├──> 02-goal-management (並行)
    │       ├──> 04-water-visualization
    │       ├──> 05-achievement-system
    │       ├──> 06-stats-dashboard
    │       └──> 07-smart-reminders
    │
    └──> 03-water-logging (並行)
            ├──> 04-water-visualization
            ├──> 05-achievement-system
            └──> 06-stats-dashboard
```

**並行開發建議**:
- `02-goal-management` 與 `03-water-logging` 可同時開發（都僅依賴 user-authentication）
- `05-achievement-system` 與 `06-stats-dashboard` 可同時開發（都依賴相同的核心功能）

## 🎨 設計原則

### 功能切分原則
1. **單一責任**: 每個 Spec 專注於一個核心功能
2. **清楚邊界**: API、組件、資料模型明確定義
3. **可並行開發**: 依賴關係清晰，支援團隊協作
4. **可獨立測試**: 每個 Spec 都有完整的測試策略

### 取捨決策
- **優先業務目標**: product.md 定義的核心功能優先於技術炫技
- **效能 vs 功能**: Phase 1 先實現基本功能，Phase 2 再優化
- **簡潔 vs 完整**: 避免過度設計，採用 YAGNI 原則

## 🛠️ 使用方式

### 給開發者
1. **按順序選擇 Spec**（從 `01` 到 `07`）
2. **閱讀對應的 `{spec_name}-prompt.md`**
3. **將提示詞提供給 Kiro** 或自行實作
4. **完成後進行驗收標準檢查**
5. **更新完成度追蹤表**

### 給 Kiro
每個 `{spec_name}-prompt.md` 都是完整的實作指引，包含：
- 功能概述與用戶旅程
- 技術要求與技術棧
- 資料模型與 API 端點
- 組件結構與實作細節（含完整程式碼範例）
- 驗收標準與測試策略

**直接使用文件內容作為 Prompt 即可開始實作。**

## 📝 Spec 模板說明

每個 Spec 遵循統一格式：

```markdown
# [Spec Name]

## 功能概述
簡短描述功能目的

## 用戶旅程
1-3 條主要旅程（P0）

## 技術要求
技術棧、效能要求、業務規則

## 資料模型
Prisma Schema + TypeScript Types

## API 端點
RESTful 路由與請求/回應範例

## 組件結構
目錄結構 + 組件職責

## 實作細節
關鍵組件與 API 實作範例

## 驗收標準
功能、效能、UX、資料驗證

## 測試策略
單元/整合/E2E 測試

## 依賴關係
前置條件與後續依賴

## 參考文件
相關文件連結
```

## 🔗 參考文件

- **Product Overview**: `.kiro/steering/product.md`
- **Technology Stack**: `.kiro/steering/tech.md`
- **Project Structure**: `.kiro/steering/structure.md`

## ✅ 完成度追蹤

| 順序 | Spec | 檔案 | 狀態 | 優先級 | 預估時間 | 實際時間 | 負責人 |
|------|------|------|------|--------|----------|----------|--------|
| 1️⃣ | user-authentication | `01-user-authentication/user-authentication-prompt.md` | 📝 未開始 | P0 | 3-5 天 | - | - |
| 2️⃣ | goal-management | `02-goal-management/goal-management-prompt.md` | 📝 未開始 | P0 | 3-4 天 | - | - |
| 3️⃣ | water-logging | `03-water-logging/water-logging-prompt.md` | 📝 未開始 | P0 | 4-6 天 | - | - |
| 4️⃣ | water-visualization | `04-water-visualization/water-visualization-prompt.md` | 📝 未開始 | P0 | 5-7 天 | - | - |
| 5️⃣ | achievement-system | `05-achievement-system/achievement-system-prompt.md` | 📝 未開始 | P1 | 4-6 天 | - | - |
| 6️⃣ | stats-dashboard | `06-stats-dashboard/stats-dashboard-prompt.md` | 📝 未開始 | P1 | 5-7 天 | - | - |
| 7️⃣ | smart-reminders | `07-smart-reminders/smart-reminders-prompt.md` | 📝 未開始 | P2 | 6-8 天 | - | - |

**圖例**:
- 📝 未開始
- 🚧 開發中
- ✅ 已完成
- 🔍 測試中

---

## 🚀 快速開始

```bash
# 1. 從第一個 Spec 開始
cd docs/specs/01-user-authentication

# 2. 閱讀 prompt
cat user-authentication-prompt.md

# 3. 使用 Kiro 開始實作
# 將 user-authentication-prompt.md 內容提供給 Kiro
```

## 💡 最佳實踐

1. **嚴格按順序開發**: 從 `01` 到 `07`，遵循依賴關係
2. **完成後再開始下一個**: 避免半成品堆積，確保每個 Spec 都通過驗收
3. **及時更新狀態**: 修改 README.md 的完成度追蹤表
4. **寫完整測試**: 每個 Spec 都要有對應的單元/整合/E2E 測試
5. **文件同步**: 實作與 Spec 有差異時，更新對應的 `{spec_name}-prompt.md`

## 📐 開發檢查清單

### 開始前
- [ ] 閱讀對應的 `{spec_name}-prompt.md`
- [ ] 確認前置依賴已完成
- [ ] 理解用戶旅程與驗收標準

### 開發中
- [ ] 按照 Spec 定義的資料模型建立 Prisma Schema
- [ ] 實作 API 端點並測試
- [ ] 建立組件並整合
- [ ] 撰寫單元測試

### 完成後
- [ ] 所有驗收標準通過
- [ ] 測試覆蓋率 > 80%
- [ ] E2E 測試通過
- [ ] 更新完成度追蹤表
- [ ] Code Review 通過

---

## 🎯 總時程估算

- **Phase 1 (MVP)**: 4-6 週
- **Phase 2 (遊戲化)**: 3-4 週
- **Phase 3 (習慣養成)**: 2-3 週

**總計**: 9-13 週（約 2-3 個月）

---

*最後更新: 2025-11-02*
*版本: 2.0.0*
*路徑: docs/specs/*
