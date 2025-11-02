---
title: Technology Stack
inclusion: always
---

# 技術架構

## 一、技術目標
打造一款「遊戲化飲水追蹤應用」，以 **即時視覺化 + 遊戲化回饋** 提升使用者飲水動機，並提供跨平台（Web / PWA）體驗，具備輕量、即時與擴充性。

---

## 二、前端技術堆疊

| 模組 | 技術 / 函式庫 | 說明 |
|------|----------------|------|
| 前端框架 | **React 18 + Vite** | 使用 React Hooks 與 Functional Component 架構，提升互動效能與模組化。 |
| UI 樣式 | **Tailwind CSS + Shadcn/UI** | 採用 Utility-first CSS 與一致的設計系統。 |
| 動畫引擎 | **Framer Motion** | 用於水桶填充與成就動畫，確保流暢互動。 |
| 圖表套件 | **Recharts** | 用於統計儀表板（每日／週／月趨勢圖）。 |
| 狀態管理 | **Zustand** | 管理全域狀態（飲水量、目標、徽章狀態）。 |
| 資料儲存 | **IndexedDB / localStorage** | 離線儲存歷史紀錄與設定，支援 PWA 模式。 |
| 推播提醒 | **Web Push API / Notification API** | 提供智慧提醒與激勵訊息。 |
| PWA 支援 | **Vite Plugin PWA** | 支援離線模式與安裝捷徑。 |

---

## 三、後端與資料層

| 模組 | 技術 | 用途 |
|------|------|------|
| Server Framework | **FastAPI (Python)** | 提供 API 服務（使用者資料、成就、同步機制）。 |
| 資料庫 | **PostgreSQL** | 儲存使用者設定、統計與徽章進度。 |
| API 層 | **REST + WebSocket** | 即時更新水桶動畫與成就回饋。 |
| 雲端部署 | **AWS (Lambda + S3 + CloudFront)** | 提供靜態頁面與後端服務部署。 |
| AI 模組 (選配) | **OpenAI GPT-4o-mini API** | 用於生成個人化激勵訊息與飲水建議。 |

---

## 四、開發工具與規範

| 工具 | 用途 |
|------|------|
| **VSCode + ESLint + Prettier** | 統一開發環境與程式風格。 |
| **Git + GitHub Actions** | 自動化測試與 CI/CD。 |
| **Jest + React Testing Library** | 單元測試與 UI 行為測試。 |
| **Figma** | 介面設計與 Prototype 文件。 |
| **Notion / Kiro Spec Kit** | 文件與規格管理（steering 檔案）。 |

---

## 五、技術限制與考量

1. **效能考量**  
   - 優先使用前端快取與漸進更新（Lazy load）。  
   - 動畫渲染效能優化於 60fps。  

2. **資料安全性**  
   - 本地儲存採用 AES 加密敏感資訊。  
   - 遠端同步透過 HTTPS + JWT 驗證。  

3. **擴充性**  
   - 模組化設計，未來可支援社群挑戰、團隊排行榜等遊戲化擴充。  

4. **跨裝置相容性**  
   - 手機／平板／桌機皆需支援。  
   - PWA 模式可安裝至主畫面使用。  
