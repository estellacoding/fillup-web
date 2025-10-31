# FillUp! 把水裝滿!

一個將日常喝水轉化為有趣遊戲化體驗的 Web 應用程式。

## 產品概述

FillUp! 不只是記錄水量，而是透過「填滿水桶」的視覺化過程，慶祝進度，並透過可量化的成就與即時回饋建立持久的健康習慣。

### 核心功能

- 🪣 **視覺化水桶進度** - 即時、直覺的進度視覺化
- 🎯 **每日目標追蹤** - 客製化目標水量與活動時段
- ⚡ **快速容量輸入** - 250ml、350ml、500ml 一鍵記錄
- 🎮 **遊戲化激勵引擎** - 慶祝動畫、可收集徽章、等級晉升
- 📊 **統計儀表板** - 每日、每週、每月統計分析
- 🔔 **智慧提醒** - 學習使用者習慣並最佳化提醒時機

## 目標使用者

- 上班族與學生 - 專注工作時需要結構化的飲水提醒
- 健身愛好者 - 將飲水量作為整體健康指標的一部分追蹤
- 健康意識者 - 偏好簡單直覺的工具，而非複雜的健康應用程式

## 技術架構

### 前端技術棧
- React/Next.js - 現代化 Web 框架
- TypeScript - 型別安全的開發體驗
- Tailwind CSS - 快速響應式設計

### 後端技術棧
- Node.js - 伺服器端運行環境
- Express.js - Web 應用框架
- MongoDB/PostgreSQL - 資料庫存儲

### 部署與維運
- Vercel/Netlify - 前端部署
- AWS/Railway - 後端部署
- GitHub Actions - CI/CD 自動化

## 開發設置

### 環境要求
- Node.js 18+
- npm 或 yarn
- Git

### 安裝步驟

1. 克隆專案
```bash
git clone https://github.com/estellacoding/fillup-web.git
cd fillup-web
```

2. 安裝依賴
```bash
npm install
# 或
yarn install
```

3. 設置環境變數
```bash
cp .env.example .env.local
# 編輯 .env.local 填入必要的環境變數
```

4. 啟動開發伺服器
```bash
npm run dev
# 或
yarn dev
```

5. 開啟瀏覽器訪問 `http://localhost:3000`

## 專案結構

```
fillup-web/
├── src/
│   ├── components/     # 可重用組件
│   ├── pages/         # 頁面組件
│   ├── hooks/         # 自定義 React Hooks
│   ├── utils/         # 工具函數
│   ├── types/         # TypeScript 型別定義
│   └── styles/        # 樣式文件
├── public/            # 靜態資源
├── docs/              # 專案文檔
└── tests/             # 測試文件
```

## 開發規範

- 遵循 TypeScript 最佳實踐
- 使用 ESLint 和 Prettier 保持代碼品質
- 編寫單元測試覆蓋核心功能
- 遵循 Git 提交規範 (Conventional Commits)

## 部署

### 開發環境
```bash
npm run build
npm run start
```

### 生產環境
專案配置了自動部署流程，推送到 main 分支將自動觸發部署。

## 貢獻指南

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 授權

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件

## 聯絡方式

- 專案維護者: Stella
- GitHub: [@estellacoding](https://github.com/estellacoding)
- 專案連結: [https://github.com/estellacoding/fillup-web](https://github.com/estellacoding/fillup-web)