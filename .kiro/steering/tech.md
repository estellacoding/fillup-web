---
title: Tech Stack
inclusion: always
---

# 技術架構

## 開發狀態
此專案目前處於規劃階段，尚未選定具體技術棧。以下為建議的技術方向。

## 建議技術棧

### 前端 (Web)
- **框架**: React 18+ 或 Vue 3+
- **語言**: TypeScript (嚴格模式)
- **樣式**: Tailwind CSS + CSS Modules
- **動畫**: Framer Motion 或 Lottie
- **狀態管理**: Zustand 或 Pinia
- **建置工具**: Vite

### 行動端 (可選)
- **跨平台**: React Native 或 Flutter
- **原生**: Swift (iOS) / Kotlin (Android)

### 後端 (如需要)
- **API**: Node.js + Express 或 Python + FastAPI
- **資料庫**: SQLite (本地) 或 PostgreSQL (雲端)
- **認證**: JWT + OAuth

## 效能要求
- **動畫**: 維持 60fps，填充動畫 300-500ms
- **回應時間**: 使用者輸入後 100ms 內回應
- **載入時間**: 首次載入 < 2 秒

## 開發工具
- **版本控制**: Git
- **程式碼品質**: ESLint + Prettier
- **測試**: Jest + Testing Library
- **CI/CD**: GitHub Actions

## 常用指令 (待實作)
```bash
# 安裝依賴
npm install

# 開發伺服器
npm run dev

# 建置
npm run build

# 測試
npm test -- --silent

# 程式碼檢查
npm run lint

# 格式化
npm run format
```