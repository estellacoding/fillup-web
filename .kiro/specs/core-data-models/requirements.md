# 需求文件

## 簡介

FillUp! 核心資料模型定義了應用程式的基礎資料結構，包含使用者檔案、飲水記錄、每日進度追蹤、成就系統與連續紀錄。這些模型將支援遊戲化的飲水追蹤體驗，提供型別安全的 TypeScript 介面，並確保資料完整性與關聯性。

## 術語表

- **System（系統）**: FillUp! 應用程式
- **User Profile（使用者檔案）**: 儲存使用者個人化設定與遊戲化進度的資料結構
- **Water Record（飲水記錄）**: 單次飲水記錄的資料結構
- **Daily Progress（每日進度）**: 特定日期的飲水進度彙總資料
- **Achievement（成就）**: 使用者可解鎖的成就徽章資料
- **Streak（連續紀錄）**: 連續達標天數的追蹤資料
- **Daily Goal（每日目標）**: 使用者設定的每日目標飲水量（毫升）
- **Activity Period（活動時段）**: 使用者設定的活動時段（開始與結束時間）
- **Reminder Preference（提醒偏好）**: 使用者的提醒通知偏好設定
- **Experience Points（經驗值）**: 使用者累積的經驗值
- **User Level（使用者等級）**: 根據經驗值計算的使用者等級
- **Record Source（記錄來源）**: 飲水記錄的來源類型（預設按鈕或自訂輸入）
- **Completion Percentage（完成百分比）**: 當日目標完成百分比
- **Achievement Type（成就類型）**: 成就的分類（目標達成、連續紀錄、里程碑等）
- **Unlock Condition（解鎖條件）**: 解鎖成就所需的條件

## 需求

### 需求 1

**使用者故事：** 作為使用者，我想要設定個人化的每日飲水目標與活動時段，以便系統能根據我的生活作息提供適當的追蹤與提醒

#### 驗收標準

1. 當使用者設定每日目標時，THE System SHALL 儲存介於 500 至 10000 毫升之間的正整數值
2. 當使用者設定活動時段時，THE System SHALL 儲存 24 小時制的開始時間與結束時間
3. THE System SHALL 驗證活動時段的結束時間晚於開始時間
4. THE System SHALL 儲存提醒偏好設定，包含啟用狀態與以分鐘為單位的頻率
5. THE System SHALL 儲存使用者等級為非負整數，並儲存經驗值為非負整數

### 需求 2

**使用者故事：** 作為使用者，我想要快速記錄每次的飲水量，以便系統能準確追蹤我的每日進度

#### 驗收標準

1. WHEN 使用者記錄飲水量時，THE System SHALL 建立包含時間戳記、毫升水量與記錄來源的 Water Record
2. THE System SHALL 驗證水量為介於 1 至 10000 毫升之間的正整數
3. THE System SHALL 儲存記錄來源為 "preset" 或 "custom"
4. THE System SHALL 將每筆 Water Record 關聯至特定的使用者識別碼
5. THE System SHALL 以 ISO 8601 格式儲存包含時區資訊的時間戳記

### 需求 3

**使用者故事：** 作為使用者，我想要查看每日的飲水進度統計，以便了解我是否達成目標

#### 驗收標準

1. THE System SHALL 計算並儲存每個日曆日期的每日進度
2. THE System SHALL 計算完成百分比為已完成水量除以目標水量再乘以 100
3. WHEN 完成百分比達到或超過 100 時，THE System SHALL 將達標狀態設定為 true
4. THE System SHALL 彙總特定日期的所有 Water Records 以計算已完成水量
5. THE System SHALL 以 ISO 8601 日期格式（YYYY-MM-DD）儲存日期

### 需求 4

**使用者故事：** 作為使用者，我想要解鎖並收集成就徽章，以便獲得持續使用的動力與成就感

#### 驗收標準

1. THE System SHALL 定義包含唯一識別碼、類型、徽章圖示參照與解鎖條件的成就
2. THE System SHALL 支援成就類型包含 "daily_goal"、"streak_milestone"、"perfect_week" 與 "volume_milestone"
3. WHEN 解鎖條件達成時，THE System SHALL 記錄包含使用者識別碼與解鎖時間戳記的成就
4. THE System SHALL 以結構化資料儲存解鎖條件，包含條件類型與所需數值
5. THE System SHALL 防止相同使用者與成就組合的重複解鎖

### 需求 5

**使用者故事：** 作為使用者，我想要追蹤我的連續達標天數，以便維持良好的飲水習慣

#### 驗收標準

1. THE System SHALL 維護當前連續天數為非負整數
2. THE System SHALL 儲存最佳連續紀錄為非負整數，代表達成的最大連續天數
3. WHEN 使用者達成每日目標時，THE System SHALL 將當前連續天數增加一
4. WHEN 使用者未達成每日目標時，THE System SHALL 將當前連續天數重置為零
5. WHEN 當前連續天數超過先前的最佳連續紀錄時，THE System SHALL 更新最佳連續紀錄
6. THE System SHALL 以 ISO 8601 日期格式儲存連續開始日期

### 需求 6

**使用者故事：** 作為開發者，我想要所有資料模型都有嚴格的 TypeScript 型別定義，以便在編譯時期捕捉型別錯誤並提供更好的開發體驗

#### 驗收標準

1. THE System SHALL 將所有資料模型定義為具有明確型別註解的 TypeScript 介面
2. THE System SHALL 對所有模型定義使用 TypeScript 嚴格模式
3. THE System SHALL 為每個模型定義回傳型別化結果的驗證函式
4. WHERE 屬性為不可變時，THE System SHALL 使用 readonly 修飾符
5. THE System SHALL 為列舉值（如記錄來源與成就類型）定義聯合型別

### 需求 7

**使用者故事：** 作為開發者，我想要資料模型之間有明確的關聯性定義，以便正確處理資料之間的依賴關係

#### 驗收標準

1. THE System SHALL 透過使用者識別碼將 Water Records 關聯至 User Profiles
2. THE System SHALL 透過使用者識別碼將 Daily Progress 關聯至 User Profiles
3. THE System SHALL 透過使用者識別碼將 Achievements 關聯至 User Profiles
4. THE System SHALL 透過使用者識別碼將 Streaks 關聯至 User Profiles
5. THE System SHALL 使用型別化的識別碼欄位定義外鍵關聯
