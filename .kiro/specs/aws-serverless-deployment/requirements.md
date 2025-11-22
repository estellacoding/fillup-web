# 需求文件

## 簡介

本文件定義將 FillUp! 飲水追蹤應用程式部署至 AWS 雲端的需求，採用無伺服器架構與基礎設施即程式碼 (IaC)。部署方案必須運用 AWS 無伺服器服務，提供可擴展、具成本效益且易於維護的解決方案，並遵循 AWS 最佳實務。

## 術語表

- **FillUp_System**: 完整的飲水追蹤應用系統，包含前端與後端元件
- **Frontend_Application**: 使用 Vite 建構的 React 漸進式網頁應用程式 (PWA)
- **Backend_API**: 基於 FastAPI 的 REST API 服務，支援 WebSocket
- **CDK_Stack**: 使用 TypeScript 撰寫的 AWS Cloud Development Kit 基礎設施定義
- **Distribution**: CloudFront CDN 分發服務，用於內容傳遞
- **Origin**: CloudFront 提供內容的來源位置
- **Edge_Location**: AWS CloudFront 內容快取節點
- **Lambda_Function**: AWS 無伺服器運算服務，用於執行後端程式碼
- **RDS_Instance**: AWS 關聯式資料庫服務，用於 PostgreSQL
- **API_Gateway**: AWS 託管服務，用於建立和管理 REST 與 WebSocket API
- **S3_Bucket**: AWS Simple Storage Service 儲存貯體，用於靜態檔案儲存
- **WAF**: AWS Web Application Firewall 網頁應用程式防火牆，用於安全防護
- **Certificate**: AWS Certificate Manager SSL/TLS 憑證
- **Deployment_Pipeline**: 自動化 CI/CD 工作流程，用於基礎設施與應用程式部署

## 需求

### 需求 1

**使用者故事:** 身為 DevOps 工程師，我想要使用 AWS 無伺服器服務部署前端應用程式，以便使用者能夠在全球範圍內以高可用性和低延遲存取 PWA

#### 驗收標準

1. THE FillUp_System SHALL 從配置為靜態網站託管的 S3_Bucket 提供 Frontend_Application 靜態資源
2. THE FillUp_System SHALL 透過啟用 Edge_Location 快取的 CloudFront Distribution 分發 Frontend_Application 內容
3. WHEN 使用者請求 Frontend_Application 內容時，THE Distribution SHALL 從最近的 Edge_Location 提供快取內容
4. THE Distribution SHALL 使用來自 AWS Certificate Manager 的有效 Certificate 強制執行僅 HTTPS 存取
5. THE FillUp_System SHALL 使用 Origin Access Identity 配置 S3_Bucket 以防止直接公開存取

### 需求 2

**使用者故事:** 身為 DevOps 工程師，我想要使用 AWS Lambda 和 API Gateway 部署後端 API，以便應用程式能夠根據需求自動擴展而無需管理伺服器

#### 驗收標準

1. THE FillUp_System SHALL 使用容器映像將 Backend_API 邏輯部署為 Lambda_Function 實例
2. THE FillUp_System SHALL 透過支援 REST API 的 API_Gateway 公開 Backend_API 端點
3. THE FillUp_System SHALL 透過支援 WebSocket API 的 API_Gateway 公開 WebSocket 連線
4. WHEN API 請求量增加時，THE Lambda_Function SHALL 自動擴展至配置的並發限制
5. THE API_Gateway SHALL 實施請求節流，每個客戶端每秒限制 1000 個請求

### 需求 3

**使用者故事:** 身為 DevOps 工程師，我想要佈建託管的 PostgreSQL 資料庫，以便應用程式資料能夠可靠地持久化，並具備自動備份和高可用性

#### 驗收標準

1. THE FillUp_System SHALL 佈建執行 PostgreSQL 15 或更高版本的 RDS_Instance
2. THE RDS_Instance SHALL 啟用自動每日備份，保留期限為 7 天
3. THE RDS_Instance SHALL 部署在無直接網際網路存取的私有子網路中
4. THE Lambda_Function SHALL 透過具有安全群組限制的 VPC 網路連線至 RDS_Instance
5. WHERE 需要高可用性時，THE RDS_Instance SHALL 啟用 Multi-AZ 部署

### 需求 4

**使用者故事:** 身為 DevOps 工程師，我想要使用 TypeScript 的 AWS CDK 定義所有基礎設施，以便基礎設施變更能夠版本控制、可審查且可重現

#### 驗收標準

1. THE CDK_Stack SHALL 使用 TypeScript CDK 建構定義所有 AWS 資源
2. THE CDK_Stack SHALL 將資源組織為前端、後端和資料庫元件的邏輯堆疊
3. THE CDK_Stack SHALL 在適用情況下使用 AWS Solutions Constructs 模式以實施最佳實務
4. THE CDK_Stack SHALL 通過啟用 AwsSolutions 規則包的 CDK Nag 安全檢查
5. THE CDK_Stack SHALL 透過 CDK 上下文參數和環境變數外部化配置值

### 需求 5

**使用者故事:** 身為 DevOps 工程師，我想要在所有 AWS 資源上實施安全最佳實務，以便應用程式和資料能夠免受常見威脅的侵害

#### 驗收標準

1. THE FillUp_System SHALL 將具有 AWS 託管規則的 WAF 附加至 Distribution 以防範常見漏洞
2. THE S3_Bucket SHALL 使用 AWS 託管金鑰 (SSE-S3) 啟用伺服器端加密
3. THE Lambda_Function SHALL 使用僅授予所需權限的最小權限 IAM 角色執行
4. THE RDS_Instance SHALL 使用 AWS KMS 加密對靜態資料進行加密
5. THE FillUp_System SHALL 為所有 Lambda_Function 實例啟用 CloudWatch Logs，保留期限為 30 天

### 需求 6

**使用者故事:** 身為 DevOps 工程師，我想要實施監控和可觀測性，以便能夠追蹤應用程式健康狀況、效能並有效排除問題

#### 驗收標準

1. THE FillUp_System SHALL 建立顯示 Distribution、Lambda_Function 和 RDS_Instance 關鍵指標的 CloudWatch 儀表板
2. THE FillUp_System SHALL 為 Lambda_Function 錯誤率在 5 分鐘內超過 5% 配置 CloudWatch 警報
3. THE FillUp_System SHALL 為 RDS_Instance CPU 使用率在 10 分鐘內超過 80% 配置 CloudWatch 警報
4. THE Lambda_Function SHALL 將業務邏輯操作的自訂指標發送至 CloudWatch
5. THE FillUp_System SHALL 為 Lambda_Function 啟用 AWS X-Ray 追蹤以追蹤請求流程

### 需求 7

**使用者故事:** 身為 DevOps 工程師，我想要實施自動化部署管線，以便基礎設施和應用程式更新能夠一致且安全地部署

#### 驗收標準

1. THE Deployment_Pipeline SHALL 使用 GitHub Actions 進行持續整合和部署
2. WHEN 程式碼推送至主分支時，THE Deployment_Pipeline SHALL 執行 CDK 合成和驗證
3. THE Deployment_Pipeline SHALL 在成功驗證和批准後部署 CDK_Stack 變更
4. THE Deployment_Pipeline SHALL 建構並部署 Frontend_Application 至 S3_Bucket，並執行 CloudFront 快取失效
5. THE Deployment_Pipeline SHALL 建構 Lambda_Function 容器映像並在部署前推送至 Amazon ECR

### 需求 8

**使用者故事:** 身為 DevOps 工程師，我想要在維持效能的同時優化成本，以便應用程式能夠在預算限制內高效運行

#### 驗收標準

1. THE S3_Bucket SHALL 實施生命週期政策，在 90 天後將不常存取的日誌轉移至 S3 Glacier
2. THE Lambda_Function SHALL 根據效能測試結果配置 512MB 至 3008MB 之間的記憶體分配
3. THE RDS_Instance SHALL 根據工作負載需求使用適當的實例類別（開發環境最小為 db.t4g.micro）
4. THE Distribution SHALL 為基於文字的內容類型啟用壓縮以降低資料傳輸成本
5. WHERE 適用時，THE FillUp_System SHALL 使用基於 AWS Graviton 的實例類型以優化成本

### 需求 9

**使用者故事:** 身為開發人員，我想要環境特定的配置，以便能夠使用適當的設定部署至開發、測試和生產環境

#### 驗收標準

1. THE CDK_Stack SHALL 透過 CDK 上下文參數支援多個部署環境
2. THE FillUp_System SHALL 應用包含環境後綴的環境特定資源命名慣例
3. WHERE 環境為生產環境時，THE RDS_Instance SHALL 啟用 Multi-AZ 部署和增強監控
4. WHERE 環境為開發環境時，THE FillUp_System SHALL 使用較小的實例大小並停用 Multi-AZ
5. THE CDK_Stack SHALL 在部署前驗證所需的環境特定參數

### 需求 10

**使用者故事:** 身為 DevOps 工程師，我想要實施災難復原能力，以便應用程式能夠在最小資料遺失和停機時間的情況下從故障中復原

#### 驗收標準

1. THE S3_Bucket SHALL 啟用版本控制以防止意外刪除
2. THE RDS_Instance SHALL 維護具有時間點復原能力的自動備份
3. THE FillUp_System SHALL 記錄復原時間目標 (RTO) 為 4 小時，復原點目標 (RPO) 為 1 小時
4. THE CDK_Stack SHALL 為所有有狀態資源定義備份保留政策
5. THE FillUp_System SHALL 將 CDK_Stack 範本和配置儲存在版本控制中以進行基礎設施復原
