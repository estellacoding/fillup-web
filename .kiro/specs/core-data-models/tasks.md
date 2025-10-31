# 實作計畫

- [x] 1. 建立專案結構與共用型別定義

  - 建立 `src/models` 目錄結構
  - 定義 Result 型別與錯誤處理介面
  - 定義所有列舉型別（RecordSource、AchievementType、ConditionType）
  - 建立共用工具函式（日期處理、ID 生成、格式驗證）
  - _需求: 6.1, 6.5_

- [x] 2. 實作 User Profile 資料模型

- [x] 2.1 建立 User Profile 介面與相關型別

  - 定義 UserProfile、ActivityPeriod、ReminderPreference 介面
  - 加入 readonly 修飾符於不可變屬性
  - 加入 JSDoc 註解說明每個欄位
  - _需求: 1.1, 1.2, 1.4, 1.5, 6.1, 6.4_

- [x] 2.2 實作 User Profile 驗證函式

  - 實作 validateUserProfile 函式
  - 驗證每日目標範圍（500-10000）
  - 驗證活動時段格式與邏輯
  - 驗證提醒偏好設定
  - 驗證等級與經驗值為非負整數
  - _需求: 1.1, 1.2, 1.3, 1.4, 1.5, 6.3_

- [ ]* 2.3 撰寫 User Profile 單元測試
  - 測試邊界值（499, 500, 10000, 10001）
  - 測試時間格式驗證
  - 測試活動時段邏輯（結束時間必須晚於開始時間）
  - 測試負數等級與經驗值的拒絕
  - _需求: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. 實作 Water Record 資料模型

- [x] 3.1 建立 Water Record 介面

  - 定義 WaterRecord 介面
  - 使用 RecordSource 聯合型別
  - 加入 readonly 修飾符於識別碼與時間戳記
  - 加入 JSDoc 註解
  - _需求: 2.1, 2.3, 2.4, 6.1, 6.4, 6.5_

- [x] 3.2 實作 Water Record 驗證函式

  - 實作 validateWaterRecord 函式
  - 驗證水量範圍（1-10000）
  - 驗證記錄來源為 'preset' 或 'custom'
  - 驗證 ISO 8601 時間戳記格式
  - 實作 isValidISO8601 輔助函式
  - _需求: 2.1, 2.2, 2.3, 2.5, 6.3_

- [ ]* 3.3 撰寫 Water Record 單元測試
  - 測試水量邊界值（0, 1, 10000, 10001）
  - 測試無效的記錄來源
  - 測試各種時間戳記格式（有效與無效）
  - 測試關聯完整性（userId 驗證）
  - _需求: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. 實作 Daily Progress 資料模型

- [x] 4.1 建立 Daily Progress 介面

  - 定義 DailyProgress 介面
  - 加入 readonly 修飾符於識別碼與日期
  - 加入 JSDoc 註解
  - _需求: 3.1, 3.5, 6.1, 6.4_

- [x] 4.2 實作 Daily Progress 計算邏輯

  - 實作 calculateDailyProgress 函式
  - 彙總特定日期的所有 Water Records
  - 計算完成百分比（已完成/目標 * 100）
  - 判斷達標狀態（百分比 >= 100）
  - 實作 extractDate 輔助函式從 ISO 8601 提取日期
  - _需求: 3.1, 3.2, 3.3, 3.4_

- [x] 4.3 實作 Daily Progress 驗證函式

  - 實作 validateDailyProgress 函式
  - 驗證日期格式（YYYY-MM-DD）
  - 驗證目標水量與已完成水量為正數
  - 驗證完成百分比計算正確性
  - _需求: 3.1, 3.2, 3.3, 3.5, 6.3_

- [ ]* 4.4 撰寫 Daily Progress 單元測試
  - 測試空記錄的進度計算（0%）
  - 測試部分完成的進度計算（50%）
  - 測試完全達標的進度計算（100%）
  - 測試超額完成的進度計算（150%）
  - 測試日期格式驗證
  - _需求: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. 實作 Achievement 資料模型

- [x] 5.1 建立 Achievement 介面

  - 定義 AchievementDefinition 介面
  - 定義 UnlockCondition 介面
  - 定義 UserAchievement 介面
  - 使用 AchievementType 與 ConditionType 聯合型別
  - 加入 readonly 修飾符
  - 加入 JSDoc 註解
  - _需求: 4.1, 4.2, 4.4, 6.1, 6.4, 6.5_

- [x] 5.2 建立預設成就定義

  - 建立 achievementDefinitions 陣列
  - 定義「首次達標」成就
  - 定義「七日連勝」成就
  - 定義「完美週」成就
  - 定義「百公升達人」成就
  - _需求: 4.1, 4.2_

- [x] 5.3 實作成就解鎖邏輯

  - 實作 checkAchievementUnlock 函式
  - 檢查成就是否已解鎖（防止重複）
  - 根據條件類型檢查解鎖條件
  - 處理 daily_goal_count 條件
  - 處理 streak_days 條件
  - 處理 perfect_week_count 條件
  - 處理 total_volume 條件
  - 建立 UserAchievement 記錄
  - _需求: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 5.4 撰寫 Achievement 單元測試
  - 測試首次解鎖成就
  - 測試防止重複解鎖
  - 測試各種條件類型的解鎖邏輯
  - 測試未達條件時不解鎖
  - 測試解鎖時間戳記正確性
  - _需求: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. 實作 Streak 資料模型

- [x] 6.1 建立 Streak 介面

  - 定義 Streak 介面
  - 加入 readonly 修飾符於識別碼
  - 加入 JSDoc 註解
  - _需求: 5.1, 5.2, 5.6, 6.1, 6.4_

- [x] 6.2 實作 Streak 更新邏輯

  - 實作 updateStreak 函式
  - 處理連續達標情況（增加計數）
  - 處理中斷後重新開始情況（重置為 1）
  - 處理未達標情況（重置為 0）
  - 更新最佳連續紀錄
  - 實作 subtractDays 輔助函式
  - _需求: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6.3 實作 Streak 驗證函式

  - 實作 validateStreak 函式
  - 驗證當前連續天數為非負整數
  - 驗證最佳連續紀錄 >= 當前連續天數
  - 驗證日期格式（YYYY-MM-DD）
  - 驗證 lastUpdatedDate >= streakStartDate
  - _需求: 5.1, 5.2, 5.6, 6.3_

- [ ]* 6.4 撰寫 Streak 單元測試
  - 測試首次達標（連續天數 = 1）
  - 測試連續達標（連續天數遞增）
  - 測試中斷後重新開始（重置為 1）
  - 測試未達標（重置為 0）
  - 測試最佳連續紀錄更新
  - 測試同一天重複更新（不重複計算）
  - _需求: 5.1, 5.2, 5.3, 5.4, 5.5_

- [-] 7. 實作資料關聯與完整性檢查
- [x] 7.1 實作外鍵驗證函式
  - 實作 validateUserExists 函式
  - 實作 validateAchievementExists 函式
  - 在建立 Water Record 時驗證 userId
  - 在建立 Daily Progress 時驗證 userId
  - 在建立 User Achievement 時驗證 userId 與 achievementId
  - 在建立 Streak 時驗證 userId
  - _需求: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 7.2 撰寫關聯完整性測試
  - 測試無效 userId 的拒絕
  - 測試無效 achievementId 的拒絕
  - 測試孤立記錄的防止
  - 測試級聯查詢的正確性
  - _需求: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. 實作錯誤處理機制
- [x] 8.1 建立錯誤型別定義
  - 定義 ValidationErrorCode 列舉
  - 定義 ValidationError 介面
  - 更新 Result 型別以支援 ValidationError
  - _需求: 6.1, 6.3_

- [x] 8.2 實作錯誤處理函式
  - 實作 createWaterRecord 函式（含錯誤處理）
  - 實作 createDailyProgress 函式（含錯誤處理）
  - 實作 createUserAchievement 函式（含錯誤處理）
  - 實作 createStreak 函式（含錯誤處理）
  - 提供詳細的錯誤訊息與欄位資訊
  - _需求: 6.3_

- [ ]* 8.3 撰寫錯誤處理測試
  - 測試各種驗證錯誤的回傳
  - 測試錯誤訊息的正確性
  - 測試錯誤碼的正確性
  - 測試錯誤欄位的正確性
  - _需求: 6.3_

- [x] 9. 建立輔助工具函式
- [x] 9.1 實作日期處理函式
  - 實作 isValidTimeFormat 函式（驗證 HH:mm）
  - 實作 isValidISO8601 函式（驗證 ISO 8601）
  - 實作 isValidDateFormat 函式（驗證 YYYY-MM-DD）
  - 實作 extractDate 函式（從 ISO 8601 提取日期）
  - 實作 subtractDays 函式（日期減法）
  - _需求: 1.2, 1.3, 2.5, 3.5, 5.6_

- [x] 9.2 實作 ID 生成函式
  - 實作 generateId 函式（UUID v4 或自增）
  - 確保 ID 唯一性
  - _需求: 2.4, 3.1, 4.1, 5.3, 6.1_

- [ ]* 9.3 撰寫工具函式測試
  - 測試各種日期格式的驗證
  - 測試日期提取的正確性
  - 測試日期減法的正確性
  - 測試 ID 生成的唯一性
  - _需求: 1.2, 1.3, 2.5, 3.5, 5.6_

- [x] 10. 建立型別定義匯出檔案
  - 建立 `src/models/index.ts` 匯出所有介面
  - 建立 `src/models/types.ts` 匯出所有型別
  - 建立 `src/models/validators.ts` 匯出所有驗證函式
  - 建立 `src/models/utils.ts` 匯出所有工具函式
  - 確保模組化與可重用性
  - _需求: 6.1, 6.2_

- [x] 11. 建立整合測試
  - 測試完整的使用者旅程（建立使用者 → 記錄飲水 → 更新進度 → 檢查成就 → 更新連續紀錄）
  - 測試多日連續達標的情境
  - 測試中斷後重新開始的情境
  - 測試多個成就同時解鎖的情境
  - 測試資料關聯的完整性
  - _需求: 1.1-1.5, 2.1-2.5, 3.1-3.5, 4.1-4.5, 5.1-5.6, 7.1-7.5_

- [ ]* 12. 建立文件與範例
  - 撰寫 README.md 說明資料模型的使用方式
  - 建立範例程式碼展示常見使用情境
  - 建立 API 文件（使用 TypeDoc）
  - 加入架構圖與流程圖
  - _需求: 6.1_
