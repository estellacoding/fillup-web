# 實作計劃

- [x] 1. 建立專案結構與核心介面
  - 建立前端目錄結構 (pages, components, store, services, hooks, utils)
  - 建立後端目錄結構 (api/routes, models, schemas, services)
  - 定義 TypeScript 介面與 Pydantic schemas
  - _需求: 5.1, 5.5_

- [x] 2. 實作後端 API 與資料模型
  - [x] 2.1 建立 Hydration 資料模型與資料庫 schema
    - 使用 SQLAlchemy 定義 Hydration 模型
    - 建立資料庫遷移檔案
    - _需求: 5.1, 5.2_

  - [x] 2.2 實作 Pydantic schemas 用於資料驗證
    - 建立 HydrationCreate, HydrationUpdate, HydrationOut schemas
    - 實作輸入驗證規則 (1-2000ml)
    - _需求: 5.5, 1.2_

  - [x] 2.3 建立 FastAPI 路由端點
    - 實作 POST /api/hydration (建立記錄)
    - 實作 GET /api/hydration (取得每日彙總)
    - 實作 PUT /api/hydration/{id} (更新記錄)
    - 實作 DELETE /api/hydration/{id} (刪除記錄)
    - _需求: 5.1, 5.2, 5.3, 4.1_

  - [ ]* 2.4 撰寫後端單元測試
    - 測試 API 端點的 CRUD 操作
    - 測試資料驗證與錯誤處理
    - 測試每日彙總計算邏輯
    - _需求: 5.4_

- [x] 3. 實作前端狀態管理與服務層
  - [x] 3.1 建立 Zustand 狀態管理 store
    - 實作 useHydrationStore 與狀態介面
    - 實作 addIntake, updateRecord, deleteRecord 動作
    - 實作離線狀態管理
    - _需求: 1.1, 4.1, 3.1_

  - [x] 3.2 實作 hydration.service API 通訊層
    - 建立 HTTP 客戶端配置
    - 實作 CRUD 操作方法
    - 實作錯誤處理與重試機制
    - _需求: 5.4, 3.4_

  - [x] 3.3 實作 IndexedDB 離線快取機制
    - 建立 IndexedDB 資料庫結構
    - 實作離線資料儲存與讀取
    - 實作同步佇列管理
    - _需求: 3.1, 3.2, 3.5_

- [x] 4. 實作核心 UI 元件
  - [x] 4.1 建立 BucketVisualizer 動畫元件
    - 使用 SVG 建立水桶視覺化
    - 整合 Framer Motion 實作 60fps 動畫
    - 實作進度百分比計算與顯示
    - 實作達標慶祝動畫
    - _需求: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.2 建立 QuickInputButtons 輸入元件
    - 實作預設容量按鈕 (250ml, 350ml, 500ml)
    - 實作自訂容量輸入欄位
    - 實作載入狀態與視覺回饋
    - _需求: 1.1, 1.2, 1.4_

  - [x] 4.3 建立 Home 主頁面整合
    - 整合 BucketVisualizer 與 QuickInputButtons
    - 實作響應式設計
    - 連接狀態管理與 API 服務
    - _需求: 1.1, 2.1, 2.5_

- [x] 5. 實作離線同步與錯誤處理
  - [x] 5.1 實作網路狀態檢測
    - 使用 navigator.onLine 檢測連線狀態
    - 實作網路恢復時的自動同步
    - _需求: 3.2, 3.4_

  - [x] 5.2 實作資料衝突解決機制
    - 使用時間戳優先順序解決衝突
    - 實作指數退避重試策略
    - _需求: 3.3, 3.4_

  - [x] 5.3 實作錯誤處理與使用者回饋
    - 建立錯誤類型定義與處理
    - 實作使用者友善的錯誤訊息
    - 實作操作成功的視覺確認
    - _需求: 1.4, 4.5_

- [x] 6. 實作記錄編輯功能
  - [x] 6.1 建立記錄編輯 UI 元件
    - 實作可編輯的容量與時間欄位
    - 實作輸入驗證與錯誤顯示
    - _需求: 4.1, 4.2, 4.3_

  - [x] 6.2 整合編輯功能到主介面
    - 實作記錄列表顯示
    - 實作編輯模式切換
    - 更新水桶視覺化以反映變更
    - _需求: 4.4, 4.5_

- [x] 7. 效能最佳化與動畫調校
  - [x] 7.1 最佳化動畫效能
    - 確保動畫達到 60fps 流暢度
    - 使用 GPU 加速的 CSS 屬性
    - 實作動畫完成回調
    - _需求: 1.3, 2.2_

  - [x] 7.2 實作元件效能最佳化
    - 使用 React.memo 避免不必要重新渲染
    - 最佳化狀態更新與 re-render 頻率
    - _需求: 1.1, 2.1_

- [ ]* 8. 撰寫前端測試
  - [ ]* 8.1 撰寫元件單元測試
    - 測試 BucketVisualizer 動畫與進度計算
    - 測試 QuickInputButtons 使用者互動
    - 測試 Home 頁面整合功能
    - _需求: 1.1, 2.1, 2.4_

  - [ ]* 8.2 撰寫狀態管理測試
    - 測試 useHydrationStore 狀態變更
    - 測試離線資料處理邏輯
    - 測試同步機制
    - _需求: 3.1, 3.2, 3.5_

  - [ ]* 8.3 撰寫整合測試
    - 測試完整的使用者流程
    - 測試 API 整合與錯誤處理
    - 測試離線到線上的同步流程
    - _需求: 1.1, 3.2, 5.4_