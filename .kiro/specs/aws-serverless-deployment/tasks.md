# 實作計畫

## 任務清單

- [ ] 1. 初始化 CDK 專案與基礎配置
  - 使用 `cdk init app --language typescript` 建立 CDK 專案結構
  - 安裝必要的 CDK 套件與 AWS Solutions Constructs
  - 配置 cdk.json 包含多環境上下文參數 (dev/prod)
  - 設定 TypeScript 編譯選項與 ESLint 規則
  - 建立 .gitignore 排除 node_modules 和 cdk.out
  - _需求: 4.1, 4.2, 4.5, 9.1, 9.5_

- [ ] 2. 實作資料庫堆疊 (Database Stack)
  - 建立 lib/database-stack.ts 檔案定義資料庫堆疊
  - 使用 CDK VPC 建構建立 3 AZ 的 VPC，包含公有、私有應用層、私有資料層子網路
  - 配置 NAT Gateway (開發環境 1 個，生產環境 3 個)
  - 建立 VPC Endpoints (S3 Gateway、ECR API/Docker、Secrets Manager)
  - 佈建 RDS PostgreSQL 實例，配置實例類別、儲存、Multi-AZ (根據環境)
  - 啟用 RDS 自動備份，設定保留期限 7 天與備份視窗
  - 啟用 RDS 加密 (KMS) 與刪除保護 (生產環境)
  - 建立 Secrets Manager Secret 儲存資料庫憑證
  - 配置安全群組規則 (Lambda → RDS 的 PostgreSQL 5432 連線)
  - 匯出 VPC ID、子網路 IDs、RDS 端點、安全群組 ID、Secret ARN
  - _需求: 3.1, 3.2, 3.3, 3.4, 3.5, 5.4, 9.3, 9.4, 10.2, 10.4_

- [ ] 3. 實作後端堆疊 (Backend Stack)
  - 建立 lib/backend-stack.ts 檔案定義後端堆疊
  - 建立 ECR Repository 用於儲存 Lambda 容器映像
  - 使用 aws-apigateway-lambda Solutions Construct 建立 REST API 與 Lambda 整合
  - 配置 Lambda 函數使用容器映像、arm64 架構、1024MB 記憶體、30 秒逾時
  - 設定 Lambda 環境變數 (DATABASE_SECRET_ARN, ENVIRONMENT, LOG_LEVEL, CORS_ORIGINS)
  - 將 Lambda 部署至 VPC 私有子網路，附加安全群組
  - 授予 Lambda IAM 權限 (讀取 Secrets Manager、寫入 CloudWatch Logs、X-Ray 追蹤、VPC 網路管理)
  - 配置 API Gateway 節流 (1000 請求/秒)、CORS、日誌記錄
  - 建立 API Gateway WebSocket API，配置 $connect、$disconnect、$default 路由
  - 啟用 Lambda 保留並發 (生產環境 10 個)
  - 啟用 AWS X-Ray 追蹤
  - 匯出 REST API Endpoint URL、WebSocket API Endpoint URL、Lambda Function ARN
  - _需求: 2.1, 2.2, 2.3, 2.4, 2.5, 3.4, 5.3, 5.5, 6.5, 8.2_


- [x] 4. 實作前端堆疊 (Frontend Stack)
  - 建立 lib/frontend-stack.ts 檔案定義前端堆疊
  - 使用 aws-cloudfront-s3 Solutions Construct 建立 S3 Bucket 與 CloudFront Distribution
  - 配置 S3 Bucket 啟用版本控制、伺服器端加密 (SSE-S3)、封鎖公開存取
  - 設定 S3 生命週期政策 (非當前版本 90 天後刪除)
  - 配置 Origin Access Control (OAC) 限制 S3 僅透過 CloudFront 存取
  - 建立 ACM Certificate 用於 HTTPS (或使用現有憑證)
  - 配置 CloudFront 快取行為 (HTML 無快取、JS/CSS/圖片長期快取)
  - 設定 CloudFront 錯誤回應 (404/403 → /index.html 用於 SPA 路由)
  - 啟用 CloudFront 壓縮 (Gzip/Brotli)
  - 強制 HTTPS 重新導向，設定 TLS 1.2 最低版本
  - 使用 aws-wafwebacl-cloudfront Solutions Construct 附加 WAF
  - 配置 WAF 規則 (AWS Managed Rules: Core Rule Set、Known Bad Inputs、速率限制)
  - 匯出 CloudFront Distribution Domain Name、S3 Bucket Name
  - _需求: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 8.4, 10.1_

- [ ] 5. 實作監控堆疊 (Monitoring Stack)
  - 建立 lib/monitoring-stack.ts 檔案定義監控堆疊
  - 建立 SNS Topic 用於告警通知，配置 Email 訂閱
  - 建立 CloudWatch Dashboard 顯示 CloudFront、API Gateway、Lambda、RDS 關鍵指標
  - 配置 Lambda 錯誤率告警 (> 5% 超過 5 分鐘)
  - 配置 Lambda 持續時間告警 (> 25 秒)
  - 配置 Lambda 節流告警 (> 0)
  - 配置 RDS CPU 使用率告警 (> 80% 超過 10 分鐘)
  - 配置 RDS 儲存空間告警 (< 2 GB)
  - 配置 RDS 連線數告警 (> 80)
  - 配置 API Gateway 5xx 錯誤告警 (> 10 個錯誤/5分鐘)
  - 設定 CloudWatch Logs 保留期限 (Lambda 30 天、API Gateway 14 天)
  - 所有告警發送至 SNS Topic
  - _需求: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6. 配置 CDK Nag 安全檢查
  - 在 CDK 應用程式中整合 CDK Nag
  - 啟用 AwsSolutions 規則包檢查所有堆疊
  - 執行 `cdk synth` 驗證安全規則
  - 審查並修正所有 CDK Nag 警告
  - 對於必要的抑制項目，記錄充分的理由
  - 確保通過所有關鍵安全檢查 (IAM、加密、日誌、網路)
  - _需求: 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_


- [ ] 7. 建立 Lambda 容器映像與 Dockerfile
  - 在 backend/ 目錄建立 Dockerfile.lambda
  - 使用 public.ecr.aws/lambda/python:3.11-arm64 作為基礎映像
  - 複製 requirements.txt 並安裝 Python 相依套件
  - 複製 FastAPI 應用程式程式碼至 Lambda 任務根目錄
  - 設定 CMD 指向 Lambda 處理器函數
  - 建立 app/main.py 中的 handler 函數作為 Lambda 入口點
  - 實作從 Secrets Manager 讀取資料庫憑證的邏輯
  - 配置 SQLAlchemy 連線池 (pool_size=5, max_overflow=10, pool_pre_ping=True)
  - 整合 AWS Lambda Powertools for Python (日誌、追蹤、指標)
  - 本地測試容器映像使用 Docker
  - _需求: 2.1, 3.4, 5.3, 6.4_

- [ ] 8. 準備前端建構產物
  - 確認 frontend/ 目錄的 React 應用程式可正常建構
  - 執行 `npm run build` 產生生產版本
  - 驗證 dist/ 目錄包含所有必要檔案 (index.html, JS, CSS, 圖片)
  - 配置前端環境變數指向 API Gateway 端點 (透過建構時注入)
  - 確認 PWA manifest.json 和 service worker 正確配置
  - _需求: 1.1, 1.2_

- [ ]* 9. 撰寫 CDK 單元測試
  - 建立 test/ 目錄用於 CDK 測試
  - 撰寫 database-stack.test.ts 測試資料庫堆疊
  - 驗證 VPC 建立 3 個可用區
  - 驗證 RDS 實例啟用加密與備份
  - 驗證安全群組規則正確配置
  - 撰寫 backend-stack.test.ts 測試後端堆疊
  - 驗證 Lambda 函數在 VPC 中
  - 驗證 API Gateway 配置節流
  - 撰寫 frontend-stack.test.ts 測試前端堆疊
  - 驗證 S3 Bucket 啟用加密與版本控制
  - 驗證 CloudFront 強制 HTTPS
  - 執行 `npm test` 確保所有測試通過
  - _需求: 4.1, 4.2, 5.2, 5.4_

- [ ] 10. 建立 GitHub Actions CI/CD 工作流程
  - 建立 .github/workflows/deploy.yml 檔案
  - 配置觸發條件 (push 至 main/develop 分支、pull request)
  - 實作驗證階段 (Lint、單元測試、CDK Nag、CDK synth)
  - 實作建構階段 (建構前端、建構 Lambda 容器映像、推送至 ECR)
  - 實作部署階段 (開發環境自動部署、生產環境需手動批准)
  - 配置 AWS 憑證使用 GitHub OIDC 或 Secrets
  - 部署後執行 CloudFront 快取失效
  - 發送部署通知至 Slack 或 Email
  - _需求: 7.1, 7.2, 7.3, 7.4, 7.5_


- [ ] 11. 執行首次部署至開發環境
  - 配置 AWS CLI 憑證與設定檔 (fillup-dev)
  - 執行 CDK Bootstrap 初始化 CDK 工具鏈資源
  - 執行 `cdk synth --context environment=dev` 驗證範本生成
  - 執行 `cdk deploy --all --context environment=dev` 部署所有堆疊
  - 驗證 VPC、RDS、Lambda、API Gateway、S3、CloudFront 資源建立成功
  - 記錄輸出的端點 URL 和資源 ARN
  - 測試 API Gateway 健康檢查端點
  - 測試前端應用程式可透過 CloudFront 存取
  - _需求: 4.1, 4.2, 9.1, 9.2, 9.4_

- [ ] 12. 配置資料庫遷移機制
  - 在 backend/ 目錄配置 Alembic 資料庫遷移工具
  - 建立初始遷移腳本定義資料庫 schema
  - 實作透過 Lambda 或 Bastion Host 執行遷移的機制
  - 執行遷移至開發環境 RDS 實例
  - 驗證資料庫 schema 正確建立
  - 記錄遷移執行程序於文件
  - _需求: 3.1, 3.2_

- [ ]* 13. 執行整合測試與效能測試
  - 建立 tests/integration/ 目錄用於整合測試
  - 撰寫 API 端點測試 (健康檢查、CRUD 操作)
  - 撰寫 WebSocket 連線測試 (建立連線、發送/接收訊息、斷開連線)
  - 測試錯誤處理 (400、401、404、500 回應)
  - 使用 Artillery 或 k6 執行負載測試 (100 並發使用者、5 分鐘)
  - 驗證回應時間 < 500ms (p95)、錯誤率 < 1%
  - 監控 Lambda 無節流、RDS 連線正常
  - 記錄效能測試結果
  - _需求: 2.4, 2.5, 6.2, 6.3, 8.2_

- [ ]* 14. 執行災難復原測試
  - 建立 RDS 手動快照
  - 從快照復原至新 RDS 實例
  - 驗證資料完整性與一致性
  - 測試 RDS 時間點復原 (PITR) 功能
  - 測試 S3 物件版本復原
  - 模擬 RDS Multi-AZ 故障轉移 (生產環境)
  - 測量故障轉移時間與應用程式影響
  - 記錄災難復原程序與 RTO/RPO 實際值
  - _需求: 10.1, 10.2, 10.3, 10.4_


- [ ] 15. 優化成本與效能
  - 使用 AWS Lambda Power Tuning 工具找出最佳記憶體配置
  - 根據測試結果調整 Lambda 記憶體大小
  - 配置 S3 生命週期政策將日誌轉移至 Glacier
  - 評估並配置 VPC Endpoints (ECR、Secrets Manager) 以減少資料傳輸成本
  - 驗證 CloudFront 快取命中率，調整快取策略
  - 配置 CloudWatch Logs 保留期限避免不必要的儲存成本
  - 設定 AWS Cost Explorer 標籤與預算告警
  - 記錄成本優化措施與預期節省
  - _需求: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 16. 準備生產環境部署
  - 審查所有配置確保符合生產環境需求
  - 驗證 Multi-AZ RDS、3 個 NAT Gateway、WAF 已啟用
  - 驗證 RDS 刪除保護、增強監控已啟用
  - 驗證 Lambda 保留並發已配置
  - 更新 cdk.json 生產環境上下文參數
  - 建立生產環境 AWS 帳戶與 IAM 角色
  - 配置生產環境 AWS CLI 設定檔 (fillup-prod)
  - 執行 CDK Bootstrap 至生產環境帳戶
  - _需求: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 17. 執行生產環境部署
  - 執行 `cdk diff --context environment=prod` 檢視變更
  - 執行 `cdk deploy --all --context environment=prod --require-approval broadening` 部署
  - 驗證所有資源建立成功
  - 執行資料庫遷移至生產環境
  - 建構並部署前端至生產環境 S3
  - 執行 CloudFront 快取失效
  - 執行煙霧測試驗證基本功能
  - 監控 CloudWatch 指標與告警
  - 記錄部署時間與任何問題
  - _需求: 7.3, 7.4, 7.5, 9.3_

- [ ]* 18. 建立運維文件與 Runbook
  - 撰寫部署指南 (README.md)
  - 記錄環境配置與上下文參數說明
  - 建立故障排除指南 (常見問題與解決方案)
  - 記錄監控與告警回應程序
  - 建立災難復原 Runbook (詳細步驟)
  - 記錄成本優化建議與最佳實務
  - 建立架構圖與資料流程圖
  - 記錄安全性最佳實務與合規性要求
  - _需求: 10.3, 10.5_


- [ ] 19. 設定持續監控與告警
  - 驗證所有 CloudWatch 告警正常運作
  - 測試告警通知發送至 SNS Topic
  - 配置 SNS Email 訂閱並確認
  - 設定 CloudWatch Dashboard 為預設監控視圖
  - 配置 AWS Cost Explorer 每日成本報告
  - 設定預算告警 (80%、90%、100% 閾值)
  - 啟用 AWS Config 合規性規則 (可選)
  - 啟用 CloudTrail 稽核日誌
  - 定期審查監控指標與成本趨勢
  - _需求: 6.1, 6.2, 6.3_

- [ ] 20. 執行安全性審查與加固
  - 審查所有 IAM 角色與政策確保最小權限
  - 驗證所有資料加密 (靜態與傳輸)
  - 檢查安全群組規則無過度開放
  - 驗證 S3 Bucket 無公開存取
  - 審查 CloudTrail 日誌確認無異常活動
  - 執行 AWS Trusted Advisor 安全檢查
  - 執行 CDK Nag 最終驗證
  - 記錄安全性審查結果與改進建議
  - _需求: 5.1, 5.2, 5.3, 5.4, 5.5_

## 任務執行順序

建議按照以下順序執行任務以確保相依性正確處理：

1. **階段 1: 基礎設施準備** (任務 1)
2. **階段 2: 核心堆疊實作** (任務 2, 3, 4, 5)
3. **階段 3: 安全性驗證** (任務 6)
4. **階段 4: 應用程式準備** (任務 7, 8)
5. **階段 5: 測試與 CI/CD** (任務 9, 10)
6. **階段 6: 開發環境部署** (任務 11, 12)
7. **階段 7: 驗證與優化** (任務 13, 14, 15)
8. **階段 8: 生產環境部署** (任務 16, 17)
9. **階段 9: 運維與監控** (任務 18, 19, 20)

## 注意事項

- 標記 `*` 的任務為可選任務，可根據專案需求決定是否執行
- 每個任務完成後應進行驗證確保功能正常
- 遇到問題時參考設計文件中的故障排除章節
- 生產環境部署前務必在開發環境充分測試
- 保持文件更新反映實際實作狀況
