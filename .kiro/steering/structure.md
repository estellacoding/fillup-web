---
title: Project Structure
inclusion: always
---

# 專案結構

## 目前狀態
專案處於早期規劃階段，僅包含規格文件和配置檔案。

## 現有結構
```
fillup-web/
├── .kiro/                    # Kiro IDE 配置
│   ├── settings/            # IDE 設定
│   │   └── mcp.json        # MCP 伺服器配置
│   ├── specs/              # 功能規格文件
│   │   ├── visual-bucket-progress/
│   │   ├── quick-water-logging/
│   │   ├── daily-goal-tracking/
│   │   ├── gamification-engine/
│   │   └── statistics-dashboard/
│   └── steering/           # AI 助手指導規則
├── .vscode/                # VSCode 配置
└── LICENSE                 # 授權文件
```

## 建議的未來結構 (Web 應用)
```
fillup-web/
├── src/
│   ├── components/         # 可重用元件
│   │   ├── ui/            # 基礎 UI 元件
│   │   ├── bucket/        # 水桶相關元件
│   │   ├── logging/       # 記錄相關元件
│   │   └── stats/         # 統計相關元件
│   ├── pages/             # 頁面元件
│   ├── hooks/             # 自訂 React Hooks
│   ├── stores/            # 狀態管理
│   ├── utils/             # 工具函數
│   ├── types/             # TypeScript 型別定義
│   ├── styles/            # 全域樣式
│   └── assets/            # 靜態資源
├── public/                # 公開資源
├── tests/                 # 測試檔案
├── docs/                  # 文件
└── 配置檔案 (package.json, tsconfig.json, etc.)
```

## 命名慣例
- **檔案**: kebab-case (例: `water-bucket.tsx`)
- **元件**: PascalCase (例: `WaterBucket`)
- **函數/變數**: camelCase (例: `logWaterIntake`)
- **常數**: UPPER_SNAKE_CASE (例: `DEFAULT_DAILY_GOAL`)
- **型別/介面**: PascalCase (例: `WaterRecord`)

## 模組組織原則
- 按功能分組，而非檔案類型
- 每個功能模組包含相關的元件、hooks、types
- 共用元件放在 `components/ui/`
- 業務邏輯與 UI 分離
- 保持檔案結構扁平，避免過深的巢狀

## 規格文件結構
每個功能規格包含：
- `requirements.md` - 需求文件
- `design.md` - 設計文件  
- `tasks.md` - 實作任務