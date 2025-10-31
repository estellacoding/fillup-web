---
title: Technology Stack
inclusion: always
---

# 技術棧

## 核心技術

### 前端框架
- **React 18+** 搭配 TypeScript
- 函數式組件搭配 Hooks
- React.memo 用於效能優化
- 大型組件使用延遲載入
- React Testing Library 用於組件測試

### TypeScript 配置
- **嚴格模式**：啟用 (`strict: true`)
- 全專案強制型別安全
- 禁止隱式 any (`noImplicitAny: true`)
- 嚴格空值檢查 (`strictNullChecks: true`)
- 所有函數需要回傳型別
- Result/Either 模式處理錯誤

### 狀態管理
- React Context API 管理全域狀態
- useState 管理本地組件狀態
- useEffect 處理副作用
- 自訂 hooks 處理可重用邏輯
- useMemo 和 useCallback 優化效能

### 樣式方案
- CSS Modules 或 styled-components
- 響應式設計模式
- 行動優先設計 (320px - 768px)
- 支援系統字體大小
- 最小觸控目標：44px（建議 88px）

## 後端基礎架構

### 雲端平台
- **AWS (Amazon Web Services)**
- 無伺服器優先架構
- 多區域部署支援（主要：us-east-1，災備：us-west-2）
- 符合 AWS Well-Architected Framework

### 運算層
- **AWS Lambda**（Node.js/TypeScript 執行環境）
- 記憶體配置：根據函數需求 256MB - 1024MB
- 逾時設定：根據函數需求 15-60 秒
- 生產環境預配置併發（100 單位）
- X-Ray 分散式追蹤啟用
- 每個功能使用獨立函數（單一職責）：
  - water-records-service（飲水記錄服務）
  - user-management-service（使用者管理服務）
  - statistics-service（統計服務）
  - achievements-service（成就服務）
  - daily-progress-service（每日進度服務）

### API 層
- **AWS API Gateway**（REST API）
- 透過 Cognito 進行 JWT 權杖認證
- 使用 JSON Schema 進行請求驗證
- 速率限制：每使用者每秒 10,000 個請求
- CORS 配置啟用
- 請求/回應轉換

### 認證系統
- **AWS Cognito User Pool**
- 基於 JWT 權杖的認證
- 存取權杖：1 小時有效期
- 更新權杖：30 天有效期
- MFA 支援（選用）
- 社交登入整合（Google、Apple）
- 密碼政策：最少 8 字元、大小寫字母、數字

### 資料庫
- **AWS DynamoDB**（NoSQL）
- 隨需計費模式自動擴展
- 時間點復原（保留 35 天）
- 全域表格支援跨區域複製
- 使用 AWS KMS 伺服器端加密

#### 資料表結構
1. **Users 資料表**
   - 分割鍵：userId
   - GSI：EmailIndex（email）

2. **WaterRecords 資料表**
   - 分割鍵：userId
   - 排序鍵：timestamp
   - GSI：DateIndex（userId, date）

3. **DailyProgress 資料表**
   - 分割鍵：userIdDate（複合鍵）
   - GSI：UserDateIndex（userId, date）

4. **Achievements 資料表**
   - 分割鍵：userId
   - 排序鍵：achievementId
   - GSI：AchievedDateIndex（userId, achievedDate）

### 檔案儲存
- **AWS S3**
- 前端靜態網站託管
- 使用者資產儲存（頭像、徽章）
- 伺服器端加密（SSE-S3）
- 版本控制啟用
- 生命週期政策優化成本
- 跨區域複製用於災難復原

### CDN
- **AWS CloudFront**
- 全球邊緣位置（200+ 個位置）
- 透過 AWS Certificate Manager 提供 SSL/TLS 憑證
- 安全標頭注入
- 壓縮啟用（Gzip、Brotli）
- 快取策略：
  - 靜態資產：1 年 TTL
  - API 回應：不快取
  - 圖片：30 天 TTL

## 資料模型

### 型別系統
- 所有資料模型使用 TypeScript 介面
- 嚴格型別，不使用 `any`
- 不可變屬性使用 readonly 修飾符
- 列舉使用聯合型別（RecordSource、AchievementType）
- 使用泛型 Result<T, E> 型別處理錯誤

### 核心資料結構

#### RecordSource（記錄來源）
```typescript
type RecordSource = 'preset' | 'custom';
```

#### AchievementType（成就類型）
```typescript
type AchievementType =
  | 'daily_goal'
  | 'streak_milestone'
  | 'perfect_week'
  | 'volume_milestone';
```

#### Result 型別
```typescript
type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };
```

### 日期時間處理
- 時間戳記使用 ISO 8601 格式
- 日期使用 YYYY-MM-DD 格式
- 時間使用 HH:mm 格式（24 小時制）
- 時間戳記包含時區資訊
- 儲存時標準化為 UTC

## 開發工具

### 套件管理
- npm 或 yarn
- 使用 lock 檔案確保一致安裝
- 優先使用最新穩定版本
- 定期更新依賴項
- 使用 Context7 MCP 伺服器驗證相容性

### 程式碼品質
- ESLint 進行 TypeScript/JavaScript 檢查
- Prettier 進行程式碼格式化
- Pre-commit hooks 進行品質檢查
- 禁止建立重複檔案（_fixed、_backup 等後綴）
- 使用有意義的變數和函數名稱

### 測試框架
- **Jest** 用於單元測試
- AWS SDK Mock 用於整合測試
- Playwright 用於端對端測試
- Postman 用於 API 測試
- 測試覆蓋率目標：>80%
- 自動化執行使用靜音模式：`npm test -- --silent`

### 版本控制
- Git 搭配 GitHub
- 功能分支工作流程
- 主分支隨時可部署
- 有意義的提交訊息
- .gitignore 排除產生的檔案和機密資訊

## CI/CD 管道

### 自動化平台
- **GitHub Actions** 用於 CI/CD 工作流程
- 每次提交自動化測試
- 多環境部署（dev、staging、production）
- 藍綠部署策略
- 失敗時 5 分鐘內自動回滾

### 基礎架構即程式碼
- **AWS CDK**（Cloud Development Kit）
- 使用 TypeScript 撰寫 CDK 程式碼
- 環境參數化配置
- 資源命名慣例包含環境前綴
- 一致的標籤策略

### 部署策略
- 自動化單元和整合測試
- CDK 部署基礎架構變更
- Lambda 函數版本管理使用別名
- 漸進式部署（10% → 50% → 100%）
- 生產環境核准閘道

## 監控與可觀測性

### 日誌記錄
- **AWS CloudWatch Logs**
- 結構化 JSON 日誌記錄
- 日誌保留政策
- 敏感日誌使用 KMS 加密

### 指標
- **AWS CloudWatch Metrics**
- 自訂應用程式指標：
  - WaterRecordCreated（飲水記錄建立）
  - DailyGoalAchieved（每日目標達成）
  - UserEngagement（使用者互動）
- API Gateway 指標（延遲、錯誤率）
- Lambda 指標（執行時間、錯誤、節流）

### 追蹤
- **AWS X-Ray**
- 所有 Lambda 函數的分散式追蹤
- API Gateway 整合
- DynamoDB 操作追蹤
- 效能瓶頸識別

### 警報
- **AWS CloudWatch Alarms**
- 錯誤率閾值：>1%
- 延遲閾值：>1000ms
- 關鍵警報使用 SNS 通知
- AWS Budgets 進行成本監控

## 安全性

### 加密
- 靜態加密：AWS KMS 客戶管理金鑰
- 傳輸加密：強制 TLS 1.2+
- S3：SSE-S3 或 SSE-KMS
- DynamoDB：伺服器端加密啟用

### 存取控制
- IAM 最小權限原則
- 角色型存取控制（RBAC）
- Lambda 執行角色使用最小權限
- API Gateway 授權器驗證 JWT
- S3 儲存桶政策限制存取

### 安全標頭
- Strict-Transport-Security（HSTS）
- Content-Type-Options
- Frame-Options（DENY）
- Referrer-Policy

### 合規性
- GDPR 合規功能
- CloudTrail 進行 API 呼叫稽核
- VPC Flow Logs 進行網路監控
- 資料保留政策
- 使用者同意管理

## 效能目標

### 回應時間
- API P95 延遲：<200ms
- Lambda 執行：<500ms
- 頁面載入時間：<3 秒
- 動畫：60fps 目標

### 可擴展性
- 支援 100 萬併發使用者
- 自動擴展啟用
- 每秒 10,000 個請求節流
- 處理 1000% 流量尖峰

### 可用性
- 99.9% 正常運行 SLA（每年 8.76 小時停機）
- 多可用區部署
- 自動故障轉移
- RTO：4 小時
- RPO：1 小時

## 國際化

### 支援語言
- 繁體中文
- 簡體中文
- English（英文）

### 在地化
- 數字格式在地化
- 日期時間格式支援（12/24 小時制）
- 系統字體大小適應
- RTL 支援考量

## 無障礙性

### 標準
- WCAG 2.1 合規目標
- 語義化 HTML/ARIA 標籤
- 鍵盤導航支援
- 螢幕閱讀器相容性
- 色彩對比驗證

### 功能
- Tab 順序邏輯
- 焦點指示器
- 圖片替代文字
- 狀態變化通知
- 觸控目標最小：44px

## 限制與約束

### 技術限制
- DynamoDB 分割鍵設計需均勻分佈
- Lambda 冷啟動使用預配置併發緩解
- API Gateway 30 秒逾時限制
- S3 覆寫 PUTS 和 DELETES 最終一致性

### 業務限制
- 飲水量範圍：1-10,000ml
- 每日目標範圍：500-10,000ml
- 使用者等級：非負整數
- 經驗值：非負整數

### 成本優化
- 不可預測工作負載使用隨需計費
- S3 生命週期政策（Standard → IA → Glacier）
- DynamoDB 自動擴展
- Lambda 記憶體優化
- CloudFront 快取減少來源請求

## 未來技術考量

### 潛在新增項目
- DynamoDB Accelerator（DAX）用於快取
- AWS AppSync 用於 GraphQL API
- Amazon EventBridge 用於事件驅動架構
- AWS Step Functions 用於複雜工作流程
- Amazon SQS 用於非同步處理

### 可擴展性增強
- 多區域主動-主動部署
- Lambda@Edge 邊緣運算
- Global Accelerator 網路優化
- ElastiCache 用於會話管理

### 進階功能
- Amazon SageMaker 機器學習
- Kinesis 即時分析
- SNS 推送通知
- API Gateway WebSocket 支援
