---
title: Project Structure
inclusion: always
---

# 專案結構

## 專案組織

### 高階目錄結構

```
fillup-web/
├── .kiro/                      # Kiro 專案規格與指導文件
│   ├── specs/                  # 功能規格
│   └── steering/               # 專案指導文件
├── infrastructure/             # AWS CDK 基礎架構程式碼（TypeScript）
│   ├── bin/                    # CDK 應用程式進入點
│   ├── lib/                    # CDK 堆疊定義
│   │   ├── stacks/             # 個別 CloudFormation 堆疊
│   │   ├── constructs/         # 可重用 CDK 建構
│   │   └── config/             # 環境配置
│   ├── test/                   # 基礎架構測試
│   └── cdk.json                # CDK 配置
├── src/                        # 後端 Lambda 函數（TypeScript）
│   ├── functions/              # Lambda 函數程式碼
│   │   ├── water-records/      # 飲水記錄服務
│   │   ├── user-management/    # 使用者管理服務
│   │   ├── statistics/         # 統計服務
│   │   ├── achievements/       # 成就服務
│   │   └── daily-progress/     # 每日進度服務
│   ├── models/                 # 共用資料模型
│   │   ├── types.ts            # 型別定義
│   │   ├── validators.ts       # 驗證函數
│   │   ├── utils.ts            # 工具函數
│   │   └── index.ts            # 匯出
│   ├── shared/                 # 共用工具
│   │   ├── database/           # DynamoDB 工具
│   │   ├── auth/               # 認證工具
│   │   └── errors/             # 錯誤處理
│   └── __tests__/              # 後端測試
├── frontend/                   # React 前端應用程式
│   ├── public/                 # 靜態資產
│   ├── src/                    # React 原始碼
│   │   ├── components/         # React 組件
│   │   │   ├── common/         # 可重用組件
│   │   │   ├── features/       # 功能特定組件
│   │   │   └── layout/         # 版面配置組件
│   │   ├── hooks/              # 自訂 React hooks
│   │   ├── contexts/           # React Context 提供者
│   │   ├── services/           # API 服務層
│   │   ├── types/              # TypeScript 型別定義
│   │   ├── utils/              # 工具函數
│   │   ├── styles/             # 全域樣式與主題
│   │   └── App.tsx             # 根組件
│   ├── tests/                  # 前端測試
│   └── package.json            # 前端依賴項
├── docs/                       # 專案文件
├── scripts/                    # 建置與部署腳本
└── package.json                # 根 package.json
```

## 基礎架構層（AWS CDK）

### 堆疊組織

```
infrastructure/lib/stacks/
├── network-stack.ts            # VPC、子網路、安全群組（如需要）
├── cognito-stack.ts            # Cognito User Pool 和 Identity Pool
├── database-stack.ts           # DynamoDB 資料表
├── storage-stack.ts            # S3 儲存桶和 CloudFront
├── lambda-stack.ts             # Lambda 函數和層
├── api-stack.ts                # API Gateway 配置
├── monitoring-stack.ts         # CloudWatch、X-Ray、警報
└── pipeline-stack.ts           # CI/CD 管道資源
```

### CDK 建構

```
infrastructure/lib/constructs/
├── lambda-function.ts          # 可重用 Lambda 函數建構
├── dynamodb-table.ts           # 可重用 DynamoDB 資料表建構
├── api-endpoint.ts             # 可重用 API 端點建構
└── monitoring-config.ts        # 可重用監控設定
```

### 環境配置

```
infrastructure/lib/config/
├── dev.ts                      # 開發環境配置
├── staging.ts                  # 預備環境配置
├── production.ts               # 生產環境配置
└── common.ts                   # 共用配置
```

### 命名慣例（基礎架構）

- **堆疊**：`PascalCase` 結尾為 `Stack`（例如：`DatabaseStack`）
- **建構**：`PascalCase`（例如：`LambdaFunction`）
- **資源**：包含環境前綴（例如：`fillup-users-dev`、`fillup-users-prod`）
- **標籤**：一致的標籤策略（Project、Environment、Owner、CostCenter）

## 後端層（Lambda 函數）

### 函數結構

每個 Lambda 函數遵循此結構：

```
src/functions/<function-name>/
├── index.ts                    # Lambda handler 進入點
├── handlers/                   # 業務邏輯處理器
│   ├── create-handler.ts
│   ├── get-handler.ts
│   ├── update-handler.ts
│   └── delete-handler.ts
├── models/                     # 函數特定模型
├── utils/                      # 函數特定工具
└── __tests__/                  # 函數測試
```

### Lambda 函數命名

- **目錄名稱**：`kebab-case`（例如：`water-records`、`user-management`）
- **CDK 中的函數名稱**：`PascalCase` + `Function` 後綴（例如：`WaterRecordsFunction`）
- **Handler 檔案**：`index.ts`，匯出 `handler` 函數
- **部署名稱**：`fillup-<function-name>-<env>`（例如：`fillup-water-records-prod`）

### 共用模型層

```
src/models/
├── user-profile.ts             # UserProfile 介面與驗證
├── water-record.ts             # WaterRecord 介面與驗證
├── daily-progress.ts           # DailyProgress 介面與驗證
├── achievement.ts              # Achievement 介面與驗證
├── streak.ts                   # Streak 介面與驗證
├── types.ts                    # 共用型別（Result、列舉）
├── validators.ts               # 驗證函數
├── utils.ts                    # 工具函數
└── index.ts                    # 中央匯出檔案
```

### 共用工具

```
src/shared/
├── database/
│   ├── dynamodb-client.ts      # DynamoDB 客戶端包裝器
│   ├── query-builder.ts        # 查詢輔助函數
│   └── batch-operations.ts     # 批次讀寫工具
├── auth/
│   ├── jwt-validator.ts        # JWT 權杖驗證
│   ├── permission-checker.ts   # 授權邏輯
│   └── cognito-utils.ts        # Cognito 輔助函數
├── errors/
│   ├── error-types.ts          # 自訂錯誤類別
│   ├── error-handler.ts        # 錯誤處理中介軟體
│   └── error-responses.ts      # 標準化錯誤回應
└── logger/
    └── logger.ts               # 結構化日誌工具
```

## 前端層（React）

### 組件組織

```
frontend/src/components/
├── common/                     # 可重用 UI 組件
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.module.css
│   │   └── Button.test.tsx
│   ├── Input/
│   ├── Modal/
│   └── Tooltip/
├── features/                   # 功能特定組件
│   ├── WaterLogging/
│   │   ├── QuickLoggingInterface.tsx
│   │   ├── CustomInputInterface.tsx
│   │   ├── HistoryPanel.tsx
│   │   └── FeedbackSystem.tsx
│   ├── BucketProgress/
│   │   ├── BucketVisualization.tsx
│   │   ├── ProgressBar.tsx
│   │   └── WavesAnimation.tsx
│   ├── Statistics/
│   │   ├── DashboardView.tsx
│   │   ├── ChartComponents.tsx
│   │   └── TrendAnalysis.tsx
│   ├── Achievements/
│   │   ├── BadgeGallery.tsx
│   │   ├── AchievementCard.tsx
│   │   └── ProgressTracker.tsx
│   ├── Onboarding/
│   │   ├── WelcomeFlow.tsx
│   │   ├── PersonalizationSetup.tsx
│   │   └── FeatureTour.tsx
│   └── UserSettings/
│       ├── GoalSettings.tsx
│       ├── ReminderSettings.tsx
│       └── ProfileSettings.tsx
└── layout/                     # 版面配置組件
    ├── Header.tsx
    ├── Navigation.tsx
    ├── Footer.tsx
    └── MainLayout.tsx
```

### 組件命名慣例

- **組件**：`PascalCase`（例如：`QuickLoggingInterface.tsx`）
- **檔案**：組件名稱與檔案名稱一致
- **Props 介面**：組件名稱 + `Props`（例如：`QuickLoggingInterfaceProps`）
- **樣式化組件**：組件名稱 + 描述性後綴（例如：`ButtonContainer`）

### Hooks 組織

```
frontend/src/hooks/
├── useWaterEntry.ts            # 飲水記錄管理
├── useDailyProgress.ts         # 每日進度追蹤
├── useAchievements.ts          # 成就邏輯
├── useAuth.ts                  # 認證狀態
├── useLocalStorage.ts          # 本地儲存包裝器
├── useDebounce.ts              # 防抖工具
└── index.ts                    # 匯出所有 hooks
```

### Hook 命名

- 總是以 `use` 為前綴（例如：`useWaterEntry`）
- 描述功能性
- 從 index.ts 匯出以便乾淨的匯入

### Context 提供者

```
frontend/src/contexts/
├── AuthContext.tsx             # 使用者認證狀態
├── UserPreferencesContext.tsx  # 使用者偏好與設定
├── ThemeContext.tsx            # 主題與樣式
└── NotificationContext.tsx     # 通知管理
```

### 服務層

```
frontend/src/services/
├── api/
│   ├── water-records.api.ts    # 飲水記錄 API 呼叫
│   ├── user.api.ts             # 使用者管理 API 呼叫
│   ├── statistics.api.ts       # 統計 API 呼叫
│   ├── achievements.api.ts     # 成就 API 呼叫
│   └── auth.api.ts             # 認證 API 呼叫
├── storage/
│   ├── local-storage.service.ts
│   └── indexed-db.service.ts
└── config/
    ├── api-config.ts           # API 端點配置
    └── constants.ts            # 應用程式常數
```

### 型別定義

```
frontend/src/types/
├── user.types.ts               # 使用者相關型別
├── water-entry.types.ts        # 飲水記錄型別
├── achievement.types.ts        # 成就型別
├── statistics.types.ts         # 統計型別
├── api.types.ts                # API 請求/回應型別
└── index.ts                    # 匯出所有型別
```

## API 端點結構

### REST API 組織

```
/api/v1/
├── /water-records              # 飲水記錄端點
│   ├── POST   /                # 建立飲水記錄
│   ├── GET    /                # 查詢飲水記錄
│   └── GET    /:id             # 取得特定記錄
├── /daily-progress             # 每日進度端點
│   └── GET    /                # 取得每日進度
├── /user                       # 使用者管理端點
│   ├── GET    /profile         # 取得使用者檔案
│   ├── PUT    /profile         # 更新使用者檔案
│   ├── PUT    /goal            # 更新每日目標
│   └── POST   /avatar          # 上傳頭像
├── /achievements               # 成就端點
│   ├── GET    /                # 列出成就
│   └── GET    /:id             # 取得成就詳情
└── /statistics                 # 統計端點
    ├── GET    /daily           # 每日統計
    ├── GET    /weekly          # 每週統計
    └── GET    /monthly         # 每月統計
```

### API 請求/回應模式

#### 成功回應格式
```json
{
  "data": { ... },
  "requestId": "req_123456789",
  "timestamp": "2025-01-20T10:30:00Z"
}
```

#### 錯誤回應格式
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "請求驗證失敗",
    "details": [ ... ],
    "requestId": "req_123456789",
    "timestamp": "2025-01-20T10:30:00Z"
  }
}
```

## 資料模型組織

### TypeScript 介面結構

```typescript
// 所有模型遵循此模式：

// 1. 使用 readonly 修飾符的介面定義
interface EntityName {
  readonly id: string;
  property: Type;
  updatedAt: string;
}

// 2. 使用 Result 型別的驗證函數
function validateEntityName(
  entity: Partial<EntityName>
): Result<EntityName> {
  // 驗證邏輯
}

// 3. 輔助函數
function createEntityName(...): EntityName { ... }
function updateEntityName(...): EntityName { ... }
```

### 模型檔案

每個資料模型有自己的檔案，包含：
- 介面定義
- 驗證函數
- 輔助函數
- JSDoc 文件

## 匯入/匯出模式

### 匯入組織

```typescript
// 1. 外部函式庫
import React from 'react';
import { useState, useEffect } from 'react';

// 2. AWS SDK
import { DynamoDB } from 'aws-sdk';

// 3. 內部模組 - 絕對匯入
import { UserProfile } from '@/models/user-profile';
import { validateWaterRecord } from '@/models/validators';

// 4. 相對匯入用於本地檔案
import { calculateProgress } from './utils';
import styles from './Component.module.css';
```

### 匯出模式

- **優先使用具名匯出**而非預設匯出
- 使用 index.ts 檔案進行桶狀匯出
- 將相關匯出分組

```typescript
// models/index.ts
export * from './user-profile';
export * from './water-record';
export * from './daily-progress';
export { Result, RecordSource } from './types';
```

## 檔案命名慣例

### 後端（Lambda/基礎架構）
- **TypeScript 檔案**：`kebab-case.ts`（例如：`water-records.ts`）
- **測試檔案**：`*.test.ts` 或 `*.spec.ts`
- **配置檔案**：`kebab-case.json` 或 `kebab-case.yaml`

### 前端（React）
- **組件**：`PascalCase.tsx`（例如：`QuickLogging.tsx`）
- **Hooks**：`camelCase.ts` 搭配 `use` 前綴（例如：`useWaterEntry.ts`）
- **工具**：`camelCase.ts`（例如：`dateHelpers.ts`）
- **樣式**：CSS Modules 使用 `Component.module.css`
- **測試檔案**：`Component.test.tsx`

### 一般
- **文件**：`lowercase-with-dashes.md`
- **配置**：`lowercase.config.js` 或 `.lowercase.json`
- **環境檔案**：`.env`、`.env.local`、`.env.production`

## 測試結構

### 後端測試

```
src/__tests__/
├── unit/                       # 單元測試
│   ├── models/
│   ├── validators/
│   └── utils/
├── integration/                # 整合測試
│   ├── database/
│   └── api/
└── e2e/                        # 端對端測試
```

### 前端測試

```
frontend/tests/
├── unit/                       # 組件單元測試
│   └── components/
├── integration/                # 整合測試
│   └── features/
└── e2e/                        # 端對端測試
    └── scenarios/
```

## 配置檔案

### 根層級
- `package.json` - 根 package 配置
- `tsconfig.json` - TypeScript 配置
- `.eslintrc.js` - ESLint 配置
- `.prettierrc` - Prettier 配置
- `.gitignore` - Git 忽略規則
- `README.md` - 專案文件

### 基礎架構
- `cdk.json` - CDK 配置
- `tsconfig.json` - CDK TypeScript 配置

### 前端
- `package.json` - 前端依賴項
- `tsconfig.json` - 前端 TypeScript 配置
- `vite.config.ts` 或 `webpack.config.js` - 建置配置

## 環境管理

### 環境變數

#### 後端（.env 檔案）
```
AWS_REGION=us-east-1
ENVIRONMENT=dev|staging|production
USER_POOL_ID=...
DYNAMODB_TABLE_PREFIX=fillup-
```

#### 前端（.env 檔案）
```
REACT_APP_API_ENDPOINT=...
REACT_APP_USER_POOL_ID=...
REACT_APP_ENVIRONMENT=dev|staging|production
```

### 依環境配置

每個環境（dev、staging、production）有：
- 帶有環境前綴的獨立 AWS 資源名稱
- 不同的擴展配置
- 適當的監控/警報閾值
- 成本優化設定

## 建置與部署

### 建置產出

```
dist/                           # 生產建置輸出
├── infrastructure/             # CDK 合成模板
├── backend/                    # Lambda 函數包
│   ├── water-records.zip
│   ├── user-management.zip
│   └── ...
└── frontend/                   # React 生產建置
    ├── index.html
    ├── assets/
    └── static/
```

### 部署流程

1. **建置階段**：編譯 TypeScript、打包 Lambda 函數
2. **測試階段**：執行單元和整合測試
3. **基礎架構階段**：部署 CDK 堆疊
4. **應用程式階段**：部署 Lambda 程式碼、上傳前端至 S3
5. **驗證階段**：執行煙霧測試、檢查健康端點

## 文件結構

```
docs/
├── api/                        # API 文件
│   ├── endpoints.md
│   └── authentication.md
├── architecture/               # 架構圖表
│   ├── system-overview.md
│   └── data-flow.md
├── guides/                     # 開發指南
│   ├── setup.md
│   ├── testing.md
│   └── deployment.md
└── adr/                        # 架構決策記錄
    └── 001-use-dynamodb.md
```

## 程式碼組織原則

### 單一職責
- 每個檔案有一個主要目的
- 組件專注於單一功能
- 函數做好一件事

### DRY（Don't Repeat Yourself）
- 共用程式碼放在共用模組
- 可重用組件和 hooks
- 配置集中在配置檔案

### 關注點分離
- 業務邏輯與 UI 分離
- 資料層與展示層分離
- 基礎架構程式碼與應用程式程式碼分離

### 模組化
- 基於功能的組織
- 清晰的模組邊界
- 模組間最小耦合
- 模組內高內聚

## 路徑別名

配置 TypeScript 路徑別名以便乾淨的匯入：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/models/*": ["src/models/*"],
      "@/shared/*": ["src/shared/*"],
      "@/functions/*": ["src/functions/*"],
      "@/components/*": ["frontend/src/components/*"],
      "@/hooks/*": ["frontend/src/hooks/*"],
      "@/services/*": ["frontend/src/services/*"]
    }
  }
}
```

這個結構確保 FillUp! 組織有序、易於維護且可擴展，同時遵循 TypeScript 和 AWS 最佳實踐。
