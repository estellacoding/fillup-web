# 設計文件

## 概述

本文件定義 FillUp! 飲水追蹤應用程式在 AWS 雲端的無伺服器架構設計。此設計採用 AWS CDK (TypeScript) 作為基礎設施即程式碼工具，運用 AWS Solutions Constructs 實現最佳實務，並整合 CDK Nag 進行安全性驗證。

### 設計目標

1. **無伺服器優先**: 使用 AWS 託管服務，消除伺服器管理負擔
2. **全球分發**: 透過 CloudFront 提供低延遲的全球存取
3. **自動擴展**: 根據流量自動調整資源規模
4. **安全性**: 實施多層安全防護與加密
5. **可觀測性**: 完整的監控、日誌和追蹤能力
6. **成本優化**: 按使用量付費，最小化閒置成本
7. **災難復原**: 自動備份與快速復原能力

### 技術堆疊

- **IaC 工具**: AWS CDK v2 (TypeScript)
- **前端託管**: Amazon S3 + CloudFront
- **後端運算**: AWS Lambda (容器映像)
- **API 管理**: Amazon API Gateway (REST + WebSocket)
- **資料庫**: Amazon RDS PostgreSQL
- **安全防護**: AWS WAF + AWS Certificate Manager
- **監控**: Amazon CloudWatch + AWS X-Ray
- **CI/CD**: GitHub Actions
- **容器註冊**: Amazon ECR

## 架構

### 高階架構圖

```
┌─────────────┐
│   使用者     │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────────────────────────┐
│              AWS WAF (防火牆)                    │
└──────────────────┬──────────────────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
       ▼                       ▼
┌──────────────┐      ┌──────────────┐
│  CloudFront  │      │  CloudFront  │
│ (靜態內容)    │      │  (API 代理)   │
└──────┬───────┘      └──────┬───────┘
       │                     │
       ▼                     ▼
┌──────────────┐      ┌──────────────────┐
│  S3 Bucket   │      │  API Gateway     │
│  (前端 PWA)   │      │  (REST+WebSocket)│
└──────────────┘      └──────┬───────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │   Lambda     │
                      │  (FastAPI)   │
                      └──────┬───────┘
                             │
                             ▼
                      ┌──────────────┐
                      │  RDS (VPC)   │
                      │  PostgreSQL  │
                      └──────────────┘
```

### 網路架構


**VPC 設計**:
- 3 個可用區 (AZ) 以實現高可用性
- 公有子網路: NAT Gateway (Lambda 對外連線使用)
- 私有子網路 (應用層): Lambda 函數
- 私有子網路 (資料層): RDS 實例
- 安全群組嚴格控制流量

**連線流程**:
1. Lambda 函數部署在私有子網路中
2. Lambda 透過 ENI 連接至 VPC
3. RDS 僅接受來自 Lambda 安全群組的連線
4. Lambda 透過 NAT Gateway 存取外部服務 (如 ECR)

### 部署架構

**多環境策略**:
- **開發環境 (dev)**: 單一 AZ、較小實例、無 WAF
- **測試環境 (staging)**: 2 AZ、中等實例、基本 WAF
- **生產環境 (prod)**: 3 AZ、Multi-AZ RDS、完整 WAF、增強監控

**CDK 堆疊組織**:
```
fillup-infra/
├── bin/
│   └── fillup-app.ts          # CDK 應用程式入口
├── lib/
│   ├── frontend-stack.ts      # 前端堆疊 (S3 + CloudFront)
│   ├── backend-stack.ts       # 後端堆疊 (API Gateway + Lambda)
│   ├── database-stack.ts      # 資料庫堆疊 (RDS + VPC)
│   ├── monitoring-stack.ts    # 監控堆疊 (CloudWatch + X-Ray)
│   └── pipeline-stack.ts      # CI/CD 堆疊 (可選)
└── cdk.json                   # CDK 配置與上下文參數
```


## 元件與介面

### 1. 前端堆疊 (Frontend Stack)

**元件**:
- **S3 Bucket**: 儲存 React PWA 建構產物
- **CloudFront Distribution**: 全球 CDN 分發
- **Origin Access Control (OAC)**: 限制 S3 僅能透過 CloudFront 存取
- **ACM Certificate**: SSL/TLS 憑證
- **WAF Web ACL**: 防護常見網頁攻擊

**使用 AWS Solutions Construct**: `aws-cloudfront-s3`

**配置細節**:
```typescript
// S3 Bucket 配置
- 啟用版本控制
- 伺服器端加密 (SSE-S3)
- 封鎖所有公開存取
- 生命週期政策: 舊版本 90 天後刪除

// CloudFront 配置
- 預設根物件: index.html
- 錯誤頁面: 404 → /index.html (SPA 路由)
- 快取行為: 
  - HTML: 無快取或短期快取
  - JS/CSS/圖片: 長期快取 (1 年)
- 壓縮: 啟用 Gzip/Brotli
- HTTP → HTTPS 重新導向
- TLS 1.2 最低版本
- 地理限制: 無 (全球可用)

// WAF 規則
- AWS Managed Rules: Core Rule Set
- AWS Managed Rules: Known Bad Inputs
- 速率限制: 2000 請求/5分鐘/IP
```

**介面**:
- **輸出**: CloudFront Distribution Domain Name
- **輸出**: S3 Bucket Name (供 CI/CD 使用)


### 2. 後端堆疊 (Backend Stack)

**元件**:
- **API Gateway REST API**: 處理 HTTP 請求
- **API Gateway WebSocket API**: 處理即時連線
- **Lambda Function**: 執行 FastAPI 應用程式
- **ECR Repository**: 儲存 Lambda 容器映像
- **Lambda Layer**: 共用相依套件 (可選)

**使用 AWS Solutions Construct**: `aws-apigateway-lambda`

**Lambda 配置**:
```typescript
// 運算配置
- 運行時: 容器映像 (Python 3.11)
- 記憶體: 1024 MB (可根據效能測試調整)
- 逾時: 30 秒
- 保留並發: 生產環境 10 個 (防止冷啟動)
- 架構: arm64 (Graviton2 - 成本優化)

// 環境變數
- DATABASE_URL: RDS 連線字串 (從 Secrets Manager 取得)
- ENVIRONMENT: dev/staging/prod
- LOG_LEVEL: INFO/DEBUG
- CORS_ORIGINS: 允許的前端網域

// VPC 配置
- 子網路: 私有應用層子網路
- 安全群組: 允許對外 HTTPS、連接 RDS

// 權限 (IAM Role)
- 讀取 Secrets Manager (資料庫密碼)
- 寫入 CloudWatch Logs
- X-Ray 追蹤權限
- VPC 網路介面管理
```

**API Gateway REST API 配置**:
```typescript
// 端點配置
- 類型: Regional
- 節流: 1000 請求/秒
- 突發限制: 2000 請求
- API 金鑰: 不需要 (使用 CORS)
- 授權: 無 (未來可加入 Cognito)

// CORS 配置
- 允許來源: CloudFront 網域
- 允許方法: GET, POST, PUT, DELETE, OPTIONS
- 允許標頭: Content-Type, Authorization
- 憑證: true

// 日誌
- 存取日誌: 啟用
- 執行日誌: ERROR 層級
```


**API Gateway WebSocket API 配置**:
```typescript
// 路由
- $connect: 連線建立處理
- $disconnect: 連線斷開處理
- $default: 預設訊息處理
- sendMessage: 自訂路由

// 連線管理
- 連線逾時: 10 分鐘
- 訊息大小限制: 128 KB
- 節流: 500 訊息/秒

// 整合
- Lambda 函數: 與 REST API 共用同一個函數
- 授權: 無 (未來可加入自訂授權器)
```

**容器映像建構**:
```dockerfile
# 基礎映像
FROM public.ecr.aws/lambda/python:3.11-arm64

# 安裝相依套件
COPY requirements.txt .
RUN pip install -r requirements.txt

# 複製應用程式
COPY app/ ${LAMBDA_TASK_ROOT}/app/

# Lambda 處理器
CMD ["app.main.handler"]
```

**介面**:
- **輸入**: Database Stack 的 RDS 連線資訊
- **輸出**: REST API Endpoint URL
- **輸出**: WebSocket API Endpoint URL
- **輸出**: Lambda Function ARN


### 3. 資料庫堆疊 (Database Stack)

**元件**:
- **VPC**: 隔離網路環境
- **RDS PostgreSQL**: 託管資料庫
- **Secrets Manager**: 儲存資料庫憑證
- **Security Groups**: 網路存取控制

**VPC 配置**:
```typescript
// CIDR 區塊
- VPC CIDR: 10.0.0.0/16

// 子網路配置 (3 AZ)
- 公有子網路: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
- 私有應用層: 10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24
- 私有資料層: 10.0.20.0/24, 10.0.21.0/24, 10.0.22.0/24

// NAT Gateway
- 開發環境: 1 個 NAT Gateway
- 生產環境: 3 個 NAT Gateway (每個 AZ 一個)

// VPC Endpoints (成本優化)
- S3 Gateway Endpoint
- ECR API Endpoint
- ECR Docker Endpoint
- Secrets Manager Endpoint
```

**RDS PostgreSQL 配置**:
```typescript
// 引擎版本
- PostgreSQL 15.x (最新穩定版)

// 實例配置
- 開發環境: db.t4g.micro (Graviton)
- 測試環境: db.t4g.small
- 生產環境: db.t4g.medium

// 儲存
- 類型: gp3 (通用 SSD)
- 大小: 20 GB (自動擴展至 100 GB)
- IOPS: 3000 (gp3 基準)

// 高可用性
- 開發環境: 單一 AZ
- 生產環境: Multi-AZ 部署

// 備份
- 自動備份: 啟用
- 備份保留期: 7 天
- 備份視窗: 03:00-04:00 UTC
- 維護視窗: 週日 04:00-05:00 UTC
- 時間點復原: 啟用

// 安全性
- 加密: 啟用 (AWS KMS)
- 公開存取: 停用
- IAM 資料庫驗證: 啟用 (未來使用)
- 刪除保護: 生產環境啟用
```


**安全群組規則**:
```typescript
// Lambda 安全群組
- 出站: 
  - PostgreSQL (5432) → RDS 安全群組
  - HTTPS (443) → 0.0.0.0/0 (外部 API 呼叫)

// RDS 安全群組
- 入站:
  - PostgreSQL (5432) ← Lambda 安全群組
- 出站: 無
```

**Secrets Manager**:
```typescript
// 儲存內容
{
  "username": "fillup_admin",
  "password": "<自動生成>",
  "engine": "postgres",
  "host": "<RDS 端點>",
  "port": 5432,
  "dbname": "fillup_db"
}

// 輪換政策
- 自動輪換: 30 天 (生產環境)
- 輪換 Lambda: AWS 託管
```

**介面**:
- **輸出**: VPC ID
- **輸出**: 私有子網路 IDs
- **輸出**: RDS 端點
- **輸出**: RDS 安全群組 ID
- **輸出**: Secrets Manager Secret ARN


### 4. 監控堆疊 (Monitoring Stack)

**元件**:
- **CloudWatch Dashboard**: 統一監控儀表板
- **CloudWatch Alarms**: 自動告警
- **CloudWatch Logs**: 集中日誌管理
- **X-Ray**: 分散式追蹤
- **SNS Topic**: 告警通知

**CloudWatch Dashboard**:
```typescript
// 小工具配置
1. CloudFront 指標
   - 請求數
   - 錯誤率 (4xx, 5xx)
   - 快取命中率
   - 資料傳輸量

2. API Gateway 指標
   - 請求數 (REST + WebSocket)
   - 延遲 (p50, p99)
   - 4xx/5xx 錯誤
   - 整合延遲

3. Lambda 指標
   - 呼叫次數
   - 錯誤數與錯誤率
   - 持續時間 (平均、最大)
   - 並發執行數
   - 節流次數

4. RDS 指標
   - CPU 使用率
   - 記憶體使用率
   - 連線數
   - 讀寫 IOPS
   - 儲存空間

5. 自訂業務指標
   - 每日活躍使用者
   - 飲水記錄建立數
   - API 回應時間
```


**CloudWatch Alarms**:
```typescript
// Lambda 告警
1. 錯誤率告警
   - 指標: Errors / Invocations
   - 閾值: > 5%
   - 評估期間: 2 個資料點 (5 分鐘)
   - 動作: 發送 SNS 通知

2. 持續時間告警
   - 指標: Duration
   - 閾值: > 25 秒 (接近 30 秒逾時)
   - 評估期間: 3 個資料點 (5 分鐘)
   - 動作: 發送 SNS 通知

3. 節流告警
   - 指標: Throttles
   - 閾值: > 0
   - 評估期間: 1 個資料點
   - 動作: 發送 SNS 通知

// RDS 告警
1. CPU 使用率告警
   - 指標: CPUUtilization
   - 閾值: > 80%
   - 評估期間: 2 個資料點 (10 分鐘)
   - 動作: 發送 SNS 通知

2. 儲存空間告警
   - 指標: FreeStorageSpace
   - 閾值: < 2 GB
   - 評估期間: 1 個資料點
   - 動作: 發送 SNS 通知

3. 連線數告警
   - 指標: DatabaseConnections
   - 閾值: > 80 (接近最大連線數)
   - 評估期間: 2 個資料點 (10 分鐘)
   - 動作: 發送 SNS 通知

// API Gateway 告警
1. 5xx 錯誤告警
   - 指標: 5XXError
   - 閾值: > 10 個錯誤/5分鐘
   - 評估期間: 1 個資料點
   - 動作: 發送 SNS 通知
```


**CloudWatch Logs 配置**:
```typescript
// Lambda 日誌
- 日誌群組: /aws/lambda/fillup-{env}-api
- 保留期限: 30 天
- 加密: 啟用 (KMS)

// API Gateway 日誌
- 存取日誌: /aws/apigateway/fillup-{env}-rest-access
- 執行日誌: /aws/apigateway/fillup-{env}-rest-execution
- 保留期限: 14 天

// RDS 日誌
- 錯誤日誌: 啟用
- 慢查詢日誌: 啟用 (> 1 秒)
- 一般日誌: 停用 (效能考量)
```

**AWS X-Ray 配置**:
```typescript
// Lambda 追蹤
- 追蹤模式: Active
- 取樣率: 10% (開發環境 100%)

// API Gateway 追蹤
- 追蹤: 啟用
- 取樣率: 與 Lambda 一致

// 追蹤資料保留
- 保留期限: 30 天
```

**SNS 通知配置**:
```typescript
// 主題
- 名稱: fillup-{env}-alerts
- 訂閱: Email (DevOps 團隊)
- 加密: 啟用

// 訊息格式
- 包含告警名稱
- 包含受影響資源
- 包含閾值與當前值
- 包含 CloudWatch 連結
```


## 資料模型

### CDK 上下文參數

```typescript
// cdk.json 中的上下文配置
{
  "context": {
    "environments": {
      "dev": {
        "account": "123456789012",
        "region": "ap-northeast-1",
        "vpcConfig": {
          "maxAzs": 2,
          "natGateways": 1
        },
        "rdsConfig": {
          "instanceClass": "t4g.micro",
          "multiAz": false,
          "backupRetention": 3
        },
        "lambdaConfig": {
          "memorySize": 512,
          "reservedConcurrency": 0
        },
        "enableWaf": false,
        "enableEnhancedMonitoring": false
      },
      "prod": {
        "account": "123456789012",
        "region": "ap-northeast-1",
        "vpcConfig": {
          "maxAzs": 3,
          "natGateways": 3
        },
        "rdsConfig": {
          "instanceClass": "t4g.medium",
          "multiAz": true,
          "backupRetention": 7,
          "deletionProtection": true
        },
        "lambdaConfig": {
          "memorySize": 1024,
          "reservedConcurrency": 10
        },
        "enableWaf": true,
        "enableEnhancedMonitoring": true
      }
    }
  }
}
```

### 環境變數結構

```typescript
// Lambda 環境變數
interface LambdaEnvironment {
  ENVIRONMENT: 'dev' | 'staging' | 'prod';
  DATABASE_SECRET_ARN: string;
  LOG_LEVEL: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
  CORS_ORIGINS: string; // 逗號分隔的網域列表
  AWS_XRAY_TRACING_NAME: string;
  POWERTOOLS_SERVICE_NAME: string;
  POWERTOOLS_METRICS_NAMESPACE: string;
}
```


### 堆疊相依性

```typescript
// 堆疊部署順序
1. DatabaseStack (VPC + RDS)
   ↓
2. BackendStack (Lambda + API Gateway)
   - 需要: DatabaseStack.vpcId
   - 需要: DatabaseStack.rdsSecurityGroupId
   - 需要: DatabaseStack.secretArn
   ↓
3. FrontendStack (S3 + CloudFront)
   - 需要: BackendStack.restApiUrl (用於 CORS)
   ↓
4. MonitoringStack (CloudWatch + Alarms)
   - 需要: 所有堆疊的資源 ARN
```

## 錯誤處理

### Lambda 錯誤處理策略

**重試機制**:
```typescript
// API Gateway 整合重試
- 最大重試次數: 2
- 重試條件: 5xx 錯誤、逾時
- 退避策略: 指數退避

// Lambda 內部重試
- 資料庫連線失敗: 重試 3 次，間隔 1 秒
- 外部 API 呼叫: 重試 2 次，指數退避
```

**錯誤回應格式**:
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "處理請求時發生錯誤",
    "requestId": "uuid",
    "timestamp": "2025-11-16T10:30:00Z"
  }
}
```

**死信佇列 (DLQ)**:
```typescript
// Lambda DLQ 配置
- 類型: SQS
- 保留期限: 14 天
- 告警: 當訊息數 > 0 時發送通知
```


### CloudFront 錯誤處理

```typescript
// 自訂錯誤回應
- 404 錯誤 → 回傳 /index.html (SPA 路由)
- 403 錯誤 → 回傳 /index.html
- 500/502/503/504 → 顯示自訂錯誤頁面
- TTL: 10 秒 (避免快取錯誤過久)
```

### RDS 錯誤處理

**連線池管理**:
```python
# SQLAlchemy 連線池配置
pool_size = 5  # 基本連線數
max_overflow = 10  # 額外連線數
pool_timeout = 30  # 取得連線逾時
pool_recycle = 3600  # 連線回收時間 (1 小時)
pool_pre_ping = True  # 使用前檢查連線
```

**故障轉移**:
- Multi-AZ 自動故障轉移: 1-2 分鐘
- 應用程式重試邏輯: 偵測到連線失敗時自動重連
- 健康檢查: Lambda 啟動時驗證資料庫連線

## 測試策略

### 基礎設施測試

**CDK 單元測試**:
```typescript
// 測試項目
1. 堆疊合成測試
   - 驗證 CloudFormation 範本生成
   - 檢查資源數量與類型

2. 快照測試
   - 比對範本變更
   - 防止意外修改

3. 細粒度斷言
   - S3 Bucket 加密啟用
   - Lambda 函數在 VPC 中
   - RDS 實例為私有
   - CloudWatch 告警已配置
```


**CDK Nag 驗證**:
```typescript
// 安全性檢查
- 規則包: AwsSolutions
- 檢查項目:
  - IAM 最小權限原則
  - S3 Bucket 安全配置
  - Lambda 函數配置
  - RDS 加密與備份
  - CloudWatch 日誌啟用

// 抑制規則 (需要充分理由)
- 記錄抑制原因
- 定期審查抑制項目
```

### 整合測試

**API 端點測試**:
```typescript
// 測試場景
1. REST API 健康檢查
   - GET /health → 200 OK

2. CRUD 操作測試
   - 建立飲水記錄
   - 讀取記錄列表
   - 更新記錄
   - 刪除記錄

3. WebSocket 連線測試
   - 建立連線
   - 發送訊息
   - 接收訊息
   - 斷開連線

4. 錯誤處理測試
   - 無效輸入 → 400
   - 未授權 → 401
   - 資源不存在 → 404
   - 伺服器錯誤 → 500
```

**效能測試**:
```typescript
// 負載測試
- 工具: Artillery 或 k6
- 場景:
  - 100 並發使用者
  - 持續 5 分鐘
  - 混合讀寫操作
- 驗證:
  - 回應時間 < 500ms (p95)
  - 錯誤率 < 1%
  - Lambda 無節流
```


### 災難復原測試

**備份驗證**:
```typescript
// 測試項目
1. RDS 快照復原
   - 建立手動快照
   - 從快照復原至新實例
   - 驗證資料完整性

2. 時間點復原 (PITR)
   - 復原至特定時間點
   - 驗證資料一致性

3. S3 版本復原
   - 刪除物件
   - 從版本歷史復原
```

**故障轉移測試**:
```typescript
// 測試場景
1. RDS Multi-AZ 故障轉移
   - 觸發主要實例重啟
   - 驗證自動故障轉移
   - 測量停機時間

2. Lambda 區域故障
   - 模擬 Lambda 錯誤
   - 驗證重試機制
   - 檢查 DLQ 訊息

3. CloudFront 快取失效
   - 部署新版本
   - 執行快取失效
   - 驗證內容更新
```

## 部署流程

### CI/CD 管線架構

```yaml
# GitHub Actions 工作流程
name: Deploy FillUp Infrastructure

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # 1. 驗證階段
  validate:
    - Lint CDK 程式碼
    - 執行單元測試
    - CDK Nag 安全檢查
    - CDK synth 驗證

  # 2. 建構階段
  build:
    - 建構前端應用程式
    - 建構 Lambda 容器映像
    - 推送映像至 ECR

  # 3. 部署階段 (開發環境)
  deploy-dev:
    - CDK deploy (自動批准)
    - 執行煙霧測試
    - 驗證健康檢查

  # 4. 部署階段 (生產環境)
  deploy-prod:
    - 需要手動批准
    - CDK deploy
    - 執行整合測試
    - CloudFront 快取失效
    - 發送部署通知
```


### 部署步驟詳解

**前置準備**:
```bash
# 1. 安裝相依套件
npm install -g aws-cdk
cd fillup-infra && npm install

# 2. 配置 AWS 憑證
aws configure
# 或使用 AWS SSO
aws sso login --profile fillup-prod

# 3. Bootstrap CDK (首次部署)
cdk bootstrap aws://ACCOUNT-ID/REGION \
  --profile fillup-prod \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

**部署命令**:
```bash
# 開發環境部署
cdk deploy --all \
  --context environment=dev \
  --profile fillup-dev

# 生產環境部署 (需要確認)
cdk deploy --all \
  --context environment=prod \
  --profile fillup-prod \
  --require-approval broadening

# 僅部署特定堆疊
cdk deploy FillUpFrontendStack-prod \
  --context environment=prod

# 檢視變更差異
cdk diff --context environment=prod
```

**前端部署**:
```bash
# 1. 建構前端
cd frontend
npm run build

# 2. 同步至 S3
aws s3 sync dist/ s3://fillup-frontend-prod-bucket/ \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html"

# 3. 上傳 index.html (無快取)
aws s3 cp dist/index.html s3://fillup-frontend-prod-bucket/ \
  --cache-control "no-cache"

# 4. CloudFront 快取失效
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```


**後端部署**:
```bash
# 1. 建構容器映像
cd backend
docker build --platform linux/arm64 \
  -t fillup-api:latest \
  -f Dockerfile.lambda .

# 2. 標記映像
docker tag fillup-api:latest \
  123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/fillup-api:latest

# 3. 登入 ECR
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.ap-northeast-1.amazonaws.com

# 4. 推送映像
docker push \
  123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/fillup-api:latest

# 5. 更新 Lambda 函數 (CDK 會自動處理)
cdk deploy FillUpBackendStack-prod --context environment=prod
```

**資料庫遷移**:
```bash
# 1. 取得資料庫憑證
aws secretsmanager get-secret-value \
  --secret-id fillup-prod-db-secret \
  --query SecretString \
  --output text

# 2. 透過 Bastion Host 或 Lambda 執行遷移
# 選項 A: 使用 SSM Session Manager 連接至 Bastion
aws ssm start-session --target i-1234567890abcdef0

# 選項 B: 透過 Lambda 執行 Alembic 遷移
# (在 Lambda 函數中包含遷移邏輯)
```

### 回滾策略

**CloudFormation 自動回滾**:
```typescript
// CDK 堆疊配置
new Stack(app, 'FillUpStack', {
  terminationProtection: true, // 生產環境
  rollbackConfiguration: {
    monitoringTimeInMinutes: 10,
    rollbackTriggers: [
      {
        arn: lambdaErrorAlarm.alarmArn,
        type: 'AWS::CloudWatch::Alarm'
      }
    ]
  }
});
```


**手動回滾程序**:
```bash
# 1. 回滾 CDK 堆疊至前一版本
aws cloudformation update-stack \
  --stack-name FillUpBackendStack-prod \
  --use-previous-template

# 2. 回滾前端至前一版本
# 使用 S3 版本控制復原檔案
aws s3api list-object-versions \
  --bucket fillup-frontend-prod-bucket \
  --prefix index.html

aws s3api copy-object \
  --bucket fillup-frontend-prod-bucket \
  --copy-source fillup-frontend-prod-bucket/index.html?versionId=VERSION_ID \
  --key index.html

# 3. 回滾資料庫 (謹慎操作)
# 從快照復原或使用時間點復原
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier fillup-prod-db \
  --target-db-instance-identifier fillup-prod-db-restored \
  --restore-time 2025-11-16T10:00:00Z
```

## 安全性考量

### 網路安全

**VPC 隔離**:
- Lambda 函數在私有子網路中執行
- RDS 無公開 IP 位址
- 使用 VPC Endpoints 減少網際網路流量
- 安全群組實施最小權限原則

**DDoS 防護**:
- CloudFront 內建 AWS Shield Standard
- WAF 速率限制規則
- API Gateway 節流設定


### 資料安全

**靜態加密**:
- S3: SSE-S3 或 SSE-KMS
- RDS: KMS 加密
- CloudWatch Logs: KMS 加密
- Secrets Manager: 預設加密

**傳輸加密**:
- CloudFront: 強制 HTTPS (TLS 1.2+)
- API Gateway: HTTPS only
- RDS: SSL/TLS 連線
- Lambda ↔ RDS: VPC 內部加密

**金鑰管理**:
```typescript
// KMS 金鑰配置
- 自動輪換: 啟用 (每年)
- 金鑰政策: 最小權限
- 別名: alias/fillup-{env}
- 多區域金鑰: 生產環境考慮
```

### 身份與存取管理

**IAM 角色設計**:
```typescript
// Lambda 執行角色
- 原則: 最小權限
- 權限:
  - 讀取 Secrets Manager (特定 Secret)
  - 寫入 CloudWatch Logs (特定日誌群組)
  - X-Ray 追蹤
  - VPC 網路介面管理
  - RDS 連線 (透過安全群組)

// CloudFormation 執行角色
- 原則: 部署所需的最小權限
- 權限邊界: 防止權限提升

// CI/CD 角色
- 原則: 僅部署權限
- 條件: 限制來源 IP 或 GitHub OIDC
```


**憑證管理**:
```typescript
// Secrets Manager 最佳實務
- 自動輪換: RDS 密碼每 30 天
- 版本控制: 保留歷史版本
- 存取日誌: CloudTrail 記錄
- 跨帳戶存取: 不允許

// 環境變數安全
- 敏感資料: 使用 Secrets Manager
- 非敏感配置: 環境變數
- 避免: 硬編碼憑證
```

### 合規性與稽核

**CloudTrail 配置**:
```typescript
// 稽核日誌
- 啟用: 所有區域
- S3 儲存: 加密、版本控制
- 保留期限: 90 天 (S3)、1 年 (Glacier)
- 日誌驗證: 啟用
- 事件選擇器:
  - 管理事件: 全部
  - 資料事件: S3、Lambda
```

**AWS Config**:
```typescript
// 合規性規則
- S3 Bucket 公開存取檢查
- RDS 加密檢查
- Lambda 在 VPC 中檢查
- CloudWatch 日誌啟用檢查
- IAM 密碼政策檢查
```

## 成本優化

### 運算成本

**Lambda 優化**:
```typescript
// 策略
1. 記憶體配置優化
   - 使用 AWS Lambda Power Tuning
   - 找出最佳記憶體/成本比

2. 架構選擇
   - 使用 arm64 (Graviton2)
   - 節省約 20% 成本

3. 保留並發
   - 僅生產環境使用
   - 避免冷啟動成本

4. 逾時設定
   - 設定合理逾時值
   - 避免長時間執行
```


### 儲存成本

**S3 優化**:
```typescript
// 生命週期政策
1. 前端資產
   - 當前版本: Standard
   - 非當前版本: 30 天後刪除

2. CloudFront 日誌
   - 0-30 天: Standard
   - 31-90 天: Standard-IA
   - 91+ 天: Glacier

3. 備份
   - 0-7 天: Standard
   - 8-30 天: Standard-IA
   - 31+ 天: Glacier Deep Archive
```

**RDS 優化**:
```typescript
// 策略
1. 實例大小調整
   - 監控 CPU/記憶體使用率
   - 使用 Graviton 實例 (t4g)

2. 儲存優化
   - 使用 gp3 (比 gp2 便宜)
   - 啟用自動擴展
   - 定期清理舊資料

3. 備份優化
   - 保留期限: 7 天 (非關鍵)
   - 快照複製: 僅必要時
```

### 網路成本

**CloudFront 優化**:
```typescript
// 策略
1. 快取優化
   - 提高快取命中率
   - 減少回源請求

2. 壓縮
   - 啟用 Gzip/Brotli
   - 減少傳輸量

3. 價格等級
   - 開發環境: 僅使用較便宜的邊緣位置
   - 生產環境: 全球分發
```


**VPC Endpoints**:
```typescript
// 成本效益分析
- Gateway Endpoints (免費): S3
- Interface Endpoints (付費): ECR, Secrets Manager
- 評估: 資料傳輸量 vs Endpoint 成本
- 建議: 生產環境使用，開發環境評估
```

### 成本監控

**AWS Cost Explorer**:
```typescript
// 監控項目
- 每日成本趨勢
- 服務別成本分析
- 標籤別成本分配
- 預算告警設定
```

**成本標籤策略**:
```typescript
// 標籤結構
{
  "Environment": "prod",
  "Application": "fillup",
  "Component": "frontend",
  "CostCenter": "engineering",
  "Owner": "devops-team"
}
```

**預算告警**:
```typescript
// 預算配置
- 每月預算: $100 (開發)、$500 (生產)
- 告警閾值: 80%、90%、100%
- 通知: Email + SNS
- 動作: 超過 100% 時發送緊急通知
```

## 災難復原計畫

### 復原目標

**RTO (復原時間目標)**: 4 小時
**RPO (復原點目標)**: 1 小時

### 備份策略

**RDS 備份**:
```typescript
// 自動備份
- 頻率: 每日
- 時間: 03:00-04:00 UTC
- 保留: 7 天
- 區域: 主要區域

// 快照
- 手動快照: 重大變更前
- 自動快照: 每週日
- 跨區域複製: 生產環境
- 保留: 30 天
```


**S3 備份**:
```typescript
// 版本控制
- 啟用: 所有 Bucket
- MFA Delete: 生產環境
- 生命週期: 非當前版本 30 天後刪除

// 跨區域複製 (CRR)
- 來源: 主要區域
- 目標: 災難復原區域
- 規則: 複製所有物件
- 儲存類別: Standard-IA
```

**基礎設施備份**:
```typescript
// CDK 程式碼
- 版本控制: Git
- 備份: GitHub
- 標籤: 每次部署

// CloudFormation 範本
- 自動儲存: S3
- 版本控制: 啟用
- 保留: 永久
```

### 復原程序

**資料庫復原**:
```bash
# 1. 從自動備份復原
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier fillup-prod-db \
  --target-db-instance-identifier fillup-prod-db-restored \
  --restore-time "2025-11-16T10:00:00Z"

# 2. 從快照復原
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier fillup-prod-db-restored \
  --db-snapshot-identifier fillup-prod-snapshot-20251116

# 3. 更新 Lambda 環境變數指向新資料庫
aws lambda update-function-configuration \
  --function-name fillup-prod-api \
  --environment Variables={DATABASE_URL=new-endpoint}
```

**應用程式復原**:
```bash
# 1. 回滾至穩定版本
git checkout tags/v1.2.3

# 2. 重新部署基礎設施
cdk deploy --all --context environment=prod

# 3. 驗證服務健康
curl https://api.fillup.example.com/health
```


### 災難情境與應對

**情境 1: 區域性故障**
```typescript
// 影響: 整個 AWS 區域不可用
// 應對:
1. 啟動災難復原區域的基礎設施
2. 從跨區域備份復原 RDS
3. 更新 Route 53 DNS 指向新區域
4. 驗證服務可用性
// 預估 RTO: 4 小時
```

**情境 2: 資料損毀**
```typescript
// 影響: 資料庫資料錯誤或損毀
// 應對:
1. 識別損毀時間點
2. 使用時間點復原至損毀前
3. 驗證資料完整性
4. 切換應用程式至復原的資料庫
// 預估 RTO: 2 小時
```

**情境 3: 安全事件**
```typescript
// 影響: 未授權存取或資料洩露
// 應對:
1. 隔離受影響資源
2. 輪換所有憑證和金鑰
3. 審查 CloudTrail 日誌
4. 從已知良好的備份復原
5. 實施額外安全控制
// 預估 RTO: 6 小時
```

## 效能優化

### 前端效能

**CloudFront 優化**:
```typescript
// 快取策略
1. 靜態資產 (JS/CSS/圖片)
   - Cache-Control: max-age=31536000
   - CloudFront TTL: 1 年
   - 版本化檔名: app.[hash].js

2. HTML 檔案
   - Cache-Control: no-cache
   - CloudFront TTL: 0
   - 每次請求驗證

3. API 回應
   - 不快取 (透過 CloudFront 傳遞)
```


**壓縮優化**:
```typescript
// CloudFront 壓縮
- 啟用: Gzip 和 Brotli
- 檔案類型:
  - text/html
  - text/css
  - application/javascript
  - application/json
  - image/svg+xml
- 最小大小: 1000 bytes
```

### 後端效能

**Lambda 冷啟動優化**:
```typescript
// 策略
1. 保留並發 (生產環境)
   - 數量: 10 個實例
   - 成本: 固定，但消除冷啟動

2. 容器映像優化
   - 使用多階段建構
   - 最小化映像大小
   - 快取相依套件層

3. 初始化優化
   - 全域變數快取資料庫連線
   - 延遲載入非關鍵模組
   - 使用 Lambda SnapStart (Java)
```

**資料庫效能**:
```typescript
// 連線池優化
- 池大小: 5-10 (根據並發量)
- 連線重用: 啟用
- 預先 ping: 啟用

// 查詢優化
- 索引: 關鍵欄位建立索引
- 查詢計畫: 定期分析
- N+1 問題: 使用 JOIN 或批次查詢

// RDS Proxy (可選)
- 連線池管理
- 故障轉移處理
- IAM 驗證
```


### API 效能

**API Gateway 優化**:
```typescript
// 快取 (可選)
- 啟用: 特定端點
- TTL: 5-60 秒
- 快取金鑰: 查詢參數
- 加密: 啟用

// 節流設定
- 穩定速率: 1000 請求/秒
- 突發: 2000 請求
- 每個金鑰: 100 請求/秒
```

**WebSocket 優化**:
```typescript
// 連線管理
- 閒置逾時: 10 分鐘
- 心跳: 每 30 秒
- 重連策略: 指數退避

// 訊息批次處理
- 批次大小: 10 訊息
- 批次間隔: 100ms
- 壓縮: 啟用
```

## 可擴展性設計

### 水平擴展

**Lambda 自動擴展**:
```typescript
// 並發配置
- 帳戶限制: 1000 (可申請提高)
- 保留並發: 10 (生產環境)
- 未保留並發: 990 (共用池)
- 擴展速度: 每分鐘 500 個實例
```

**RDS 讀取副本**:
```typescript
// 擴展策略
- 主要實例: 寫入操作
- 讀取副本: 讀取操作
- 數量: 根據讀取負載 (0-5 個)
- 區域: 同區域或跨區域
- 自動故障轉移: 提升副本為主要
```


### 垂直擴展

**Lambda 記憶體調整**:
```typescript
// 調整策略
- 初始: 1024 MB
- 監控: CPU 和記憶體使用率
- 調整: 根據 Lambda Power Tuning 結果
- 範圍: 512 MB - 3008 MB
```

**RDS 實例升級**:
```typescript
// 升級路徑
- 開發: t4g.micro → t4g.small
- 測試: t4g.small → t4g.medium
- 生產: t4g.medium → t4g.large → r6g.large

// 升級時機
- CPU > 70% 持續 1 小時
- 記憶體 > 80% 持續 1 小時
- 連線數接近上限
```

### 快取策略

**多層快取**:
```typescript
// 1. CloudFront (邊緣快取)
- 靜態內容: 長期快取
- 動態內容: 不快取

// 2. API Gateway 快取 (可選)
- 特定端點: 短期快取 (5-60 秒)
- 查詢結果: 快取

// 3. 應用程式快取 (未來)
- Redis/ElastiCache
- 會話資料
- 頻繁查詢結果
```

## 未來擴展考量

### 多區域部署

**架構演進**:
```typescript
// 階段 1: 單區域 (當前)
- 主要區域: ap-northeast-1
- 災難復原: 手動故障轉移

// 階段 2: 主動-被動
- 主要區域: ap-northeast-1
- 備用區域: us-west-2
- 自動故障轉移: Route 53 健康檢查

// 階段 3: 主動-主動
- 多個區域同時服務
- 全球負載平衡
- 資料同步策略
```


### 認證與授權

**未來整合 Cognito**:
```typescript
// 使用者池配置
- 註冊/登入流程
- MFA 支援
- 社交登入 (Google, Apple)
- JWT Token 驗證

// API Gateway 授權器
- Cognito User Pool 授權器
- 自訂授權器 (進階場景)
- API 金鑰 (第三方整合)
```

### 進階功能

**事件驅動架構**:
```typescript
// EventBridge 整合
- 使用者事件: 註冊、達成目標
- 系統事件: 備份完成、告警觸發
- 第三方整合: Webhook、通知

// SQS 佇列
- 非同步處理
- 解耦服務
- 重試機制
```

**AI/ML 整合**:
```typescript
// 未來功能
- 個人化建議: SageMaker
- 圖片識別: Rekognition
- 自然語言處理: Comprehend
- 聊天機器人: Lex
```

## 設計決策記錄

### 決策 1: 使用容器映像而非 ZIP 部署

**理由**:
- FastAPI 應用程式相依套件較大
- 容器映像支援更大的部署包 (10 GB vs 250 MB)
- 更好的本地開發體驗 (Docker)
- 一致的建構環境

**權衡**:
- 冷啟動時間稍長
- 需要 ECR 管理
- 建構時間較長


### 決策 2: RDS 而非 DynamoDB

**理由**:
- 現有應用程式使用 PostgreSQL
- 複雜查詢需求 (JOIN、聚合)
- 關聯式資料模型
- 團隊熟悉 SQL

**權衡**:
- 需要 VPC 配置
- 冷啟動時連線建立
- 成本較高 (固定成本)
- 擴展性較 DynamoDB 低

**未來考量**:
- 高流量場景可考慮 DynamoDB
- 混合架構: RDS + DynamoDB

### 決策 3: CloudFront + S3 而非 Amplify Hosting

**理由**:
- 更細粒度的控制
- 與 CDK 整合更好
- 成本透明度
- 符合企業標準

**權衡**:
- 需要手動配置 CI/CD
- 快取失效需要額外步驟
- 沒有內建預覽環境

### 決策 4: API Gateway 而非 ALB

**理由**:
- 無伺服器架構一致性
- 內建節流和快取
- WebSocket 支援
- 按請求計費

**權衡**:
- 29 秒逾時限制
- 10 MB 請求大小限制
- 較高的每請求成本 (高流量時)


### 決策 5: Graviton (arm64) 架構

**理由**:
- 成本節省 20%
- 效能提升 (某些工作負載)
- AWS 推薦的未來方向
- Python 生態系統支援良好

**權衡**:
- 某些套件可能不相容
- 本地開發需要 arm64 環境或模擬
- 建構時間可能較長

**驗證**:
- 在開發環境充分測試
- 確認所有相依套件支援 arm64

## 參考資源

### AWS 文件
- [AWS CDK Developer Guide](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [Amazon RDS User Guide](https://docs.aws.amazon.com/rds/)
- [Amazon CloudFront Developer Guide](https://docs.aws.amazon.com/cloudfront/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

### AWS Solutions Constructs
- [aws-cloudfront-s3](https://docs.aws.amazon.com/solutions/latest/constructs/aws-cloudfront-s3.html)
- [aws-apigateway-lambda](https://docs.aws.amazon.com/solutions/latest/constructs/aws-apigateway-lambda.html)

### 最佳實務
- [Serverless Application Lens](https://docs.aws.amazon.com/wellarchitected/latest/serverless-applications-lens/)
- [Security Best Practices for Lambda](https://docs.aws.amazon.com/lambda/latest/dg/lambda-security.html)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)

### 工具
- [AWS Lambda Power Tuning](https://github.com/alexcasalboni/aws-lambda-power-tuning)
- [CDK Nag](https://github.com/cdklabs/cdk-nag)
- [AWS Solutions Constructs](https://aws.amazon.com/solutions/constructs/)

---

**文件版本**: 1.0  
**最後更新**: 2025-11-16  
**作者**: DevOps Team  
**審查者**: 待定
