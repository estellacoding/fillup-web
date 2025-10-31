# 設計文件

## 概述

FillUp! 資料同步與隱私系統採用本地優先架構，確保使用者在離線狀態下擁有完整功能，同時提供選用的雲端同步服務。系統設計重點在於資料主權、隱私保護與 GDPR 合規性。

## 架構

### 整體架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                    FillUp! 客戶端應用程式                      │
├─────────────────────────────────────────────────────────────┤
│  使用者介面層                                                 │
│  ├─ 資料管理介面    ├─ 隱私設定    ├─ 同步狀態顯示            │
├─────────────────────────────────────────────────────────────┤
│  業務邏輯層                                                   │
│  ├─ 資料服務       ├─ 同步管理     ├─ 隱私控制               │
├─────────────────────────────────────────────────────────────┤
│  資料存取層                                                   │
│  ├─ 本地儲存管理   ├─ 加密服務     ├─ 備份管理               │
├─────────────────────────────────────────────────────────────┤
│  基礎設施層                                                   │
│  ├─ IndexedDB      ├─ 檔案系統     ├─ 網路通訊               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      雲端同步服務                             │
├─────────────────────────────────────────────────────────────┤
│  API 閘道 (身份驗證、限流、監控)                              │
├─────────────────────────────────────────────────────────────┤
│  同步服務                                                     │
│  ├─ 衝突解決引擎   ├─ 版本控制     ├─ 增量同步               │
├─────────────────────────────────────────────────────────────┤
│  資料服務                                                     │
│  ├─ 加密資料庫     ├─ 備份服務     ├─ 稽核日誌               │
├─────────────────────────────────────────────────────────────┤
│  基礎設施                                                     │
│  ├─ 資料庫叢集     ├─ 物件儲存     ├─ 訊息佇列               │
└─────────────────────────────────────────────────────────────┘
```

### 本地優先架構

系統採用本地優先設計模式：
- **主要資料儲存**：所有資料預設儲存在客戶端
- **雲端作為備份**：雲端服務僅作為同步與備份用途
- **離線完整功能**：無網路連線時保持 100% 功能性
- **最終一致性**：多裝置間採用最終一致性模型

## 元件與介面

### 1. 本地儲存管理器 (LocalStorageManager)

```typescript
interface LocalStorageManager {
  // 核心資料操作
  save<T>(key: string, data: T): Promise<void>
  load<T>(key: string): Promise<T | null>
  delete(key: string): Promise<void>
  
  // 批次操作
  saveBatch(operations: StorageOperation[]): Promise<void>
  loadBatch(keys: string[]): Promise<Record<string, any>>
  
  // 查詢與索引
  query(filter: QueryFilter): Promise<any[]>
  createIndex(indexName: string, keyPath: string): Promise<void>
  
  // 儲存統計
  getStorageStats(): Promise<StorageStats>
  cleanup(): Promise<void>
}

interface StorageOperation {
  type: 'save' | 'delete'
  key: string
  data?: any
}

interface StorageStats {
  totalSize: number
  itemCount: number
  lastCleanup: Date
}
```

### 2. 加密服務 (EncryptionService)

```typescript
interface EncryptionService {
  // 資料加密
  encrypt(data: string, key?: string): Promise<EncryptedData>
  decrypt(encryptedData: EncryptedData, key?: string): Promise<string>
  
  // 金鑰管理
  generateKey(): Promise<CryptoKey>
  deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey>
  exportKey(key: CryptoKey): Promise<string>
  importKey(keyData: string): Promise<CryptoKey>
  
  // 雜湊與簽章
  hash(data: string): Promise<string>
  sign(data: string, privateKey: CryptoKey): Promise<string>
  verify(data: string, signature: string, publicKey: CryptoKey): Promise<boolean>
}

interface EncryptedData {
  data: string
  iv: string
  salt: string
  algorithm: string
}
```

### 3. 同步管理器 (SyncManager)

```typescript
interface SyncManager {
  // 同步控制
  enableSync(credentials: SyncCredentials): Promise<void>
  disableSync(): Promise<void>
  startSync(): Promise<SyncResult>
  
  // 狀態管理
  getSyncStatus(): SyncStatus
  getLastSyncTime(): Date | null
  
  // 衝突處理
  resolveConflicts(conflicts: DataConflict[]): Promise<ConflictResolution[]>
  
  // 事件監聽
  onSyncStatusChange(callback: (status: SyncStatus) => void): void
  onConflictDetected(callback: (conflicts: DataConflict[]) => void): void
}

interface SyncStatus {
  enabled: boolean
  inProgress: boolean
  lastSync: Date | null
  pendingChanges: number
  error?: string
}

interface DataConflict {
  key: string
  localData: any
  remoteData: any
  localTimestamp: Date
  remoteTimestamp: Date
}
```

### 4. 備份管理器 (BackupManager)

```typescript
interface BackupManager {
  // 自動備份
  createAutoBackup(): Promise<BackupInfo>
  scheduleAutoBackup(interval: number): void
  
  // 手動備份
  createManualBackup(name?: string): Promise<BackupInfo>
  exportBackup(backupId: string, format: 'json' | 'csv'): Promise<Blob>
  
  // 還原功能
  listBackups(): Promise<BackupInfo[]>
  restoreFromBackup(backupId: string): Promise<void>
  
  // 備份管理
  deleteBackup(backupId: string): Promise<void>
  cleanupOldBackups(): Promise<void>
}

interface BackupInfo {
  id: string
  name: string
  createdAt: Date
  size: number
  type: 'auto' | 'manual'
  dataVersion: string
}
```

### 5. 隱私控制器 (PrivacyController)

```typescript
interface PrivacyController {
  // 資料匯出
  exportUserData(format: 'json' | 'csv'): Promise<Blob>
  
  // 帳號管理
  deleteAccount(): Promise<void>
  scheduleAccountDeletion(days: number): Promise<void>
  cancelAccountDeletion(): Promise<void>
  
  // 資料保留
  setDataRetention(period: RetentionPeriod): Promise<void>
  getDataRetention(): Promise<RetentionPeriod>
  
  // 同意管理
  updateConsent(consentType: ConsentType, granted: boolean): Promise<void>
  getConsentStatus(): Promise<ConsentStatus>
  
  // 稽核
  getDataProcessingLog(): Promise<AuditLogEntry[]>
}

interface RetentionPeriod {
  months: number | 'indefinite'
}

interface ConsentStatus {
  analytics: boolean
  cloudSync: boolean
  marketing: boolean
  lastUpdated: Date
}
```

## 資料模型

### 核心資料結構

```typescript
// 使用者資料
interface UserData {
  id: string
  profile: UserProfile
  settings: UserSettings
  waterRecords: WaterRecord[]
  goals: Goal[]
  achievements: Achievement[]
  createdAt: Date
  updatedAt: Date
  version: number
}

// 飲水記錄
interface WaterRecord {
  id: string
  amount: number // 毫升
  timestamp: Date
  source: 'manual' | 'quick-add' | 'reminder'
  deviceId: string
  syncStatus: 'local' | 'synced' | 'conflict'
}

// 同步中繼資料
interface SyncMetadata {
  lastModified: Date
  deviceId: string
  version: number
  checksum: string
}

// 加密包裝
interface EncryptedUserData {
  encryptedData: EncryptedData
  metadata: SyncMetadata
  keyDerivationInfo: KeyDerivationInfo
}
```

### 資料庫架構

```sql
-- IndexedDB 物件儲存
ObjectStore: userData
  - keyPath: 'id'
  - indexes: ['timestamp', 'syncStatus', 'deviceId']

ObjectStore: backups
  - keyPath: 'id'
  - indexes: ['createdAt', 'type']

ObjectStore: syncQueue
  - keyPath: 'id'
  - indexes: ['timestamp', 'operation']

ObjectStore: auditLog
  - keyPath: 'id'
  - indexes: ['timestamp', 'action']
```

## 錯誤處理

### 錯誤分類與處理策略

```typescript
enum ErrorType {
  STORAGE_ERROR = 'storage_error',
  ENCRYPTION_ERROR = 'encryption_error',
  SYNC_ERROR = 'sync_error',
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  PERMISSION_ERROR = 'permission_error'
}

interface ErrorHandler {
  handleError(error: AppError): Promise<ErrorResolution>
  retryOperation(operation: () => Promise<any>, maxRetries: number): Promise<any>
  logError(error: AppError): Promise<void>
}

interface ErrorResolution {
  resolved: boolean
  action: 'retry' | 'fallback' | 'user_intervention'
  message?: string
}
```

### 錯誤恢復機制

1. **儲存錯誤**：自動切換到備用儲存機制
2. **加密錯誤**：提示使用者重新輸入密碼或重置金鑰
3. **同步錯誤**：指數退避重試，最多 5 次
4. **網路錯誤**：離線模式繼續運作，連線恢復後自動同步
5. **驗證錯誤**：資料完整性檢查與自動修復

## 測試策略

### 單元測試

- **本地儲存**：資料 CRUD 操作、索引查詢、批次處理
- **加密服務**：加解密正確性、金鑰管理、效能測試
- **同步邏輯**：衝突解決演算法、增量同步、錯誤處理
- **備份功能**：備份建立、還原驗證、資料完整性

### 整合測試

- **離線功能**：完整離線操作流程
- **同步流程**：多裝置同步情境
- **錯誤恢復**：各種錯誤情境的恢復測試
- **效能測試**：大量資料處理、同步效能

### 端對端測試

- **使用者流程**：完整的資料管理流程
- **隱私合規**：GDPR 相關功能驗證
- **跨平台**：不同裝置與瀏覽器的相容性

### 安全測試

- **加密強度**：密碼學實作驗證
- **資料洩漏**：記憶體與儲存安全檢查
- **權限控制**：存取控制機制測試

## 效能考量

### 本地儲存最佳化

- **索引策略**：為常用查詢建立複合索引
- **資料分割**：按時間範圍分割大型資料集
- **快取機制**：記憶體快取熱門資料
- **壓縮**：非活躍資料壓縮儲存

### 同步最佳化

- **增量同步**：僅同步變更的資料
- **批次處理**：合併多個小變更
- **壓縮傳輸**：網路傳輸資料壓縮
- **智慧排程**：根據網路狀況調整同步頻率

### 記憶體管理

- **物件池**：重複使用物件減少 GC 壓力
- **延遲載入**：按需載入歷史資料
- **資料清理**：定期清理過期暫存資料

## 安全設計

### 加密實作

- **演算法**：AES-256-GCM 用於資料加密
- **金鑰衍生**：PBKDF2 與隨機鹽值
- **傳輸安全**：TLS 1.3 端對端加密
- **金鑰輪替**：定期更新加密金鑰

### 存取控制

- **身份驗證**：多因素驗證支援
- **授權機制**：基於角色的存取控制
- **工作階段管理**：安全的工作階段處理
- **稽核追蹤**：完整的操作日誌記錄

### 隱私保護

- **資料最小化**：僅收集必要資料
- **匿名化**：統計資料去識別化
- **同意管理**：細粒度的同意控制
- **資料主權**：使用者完全控制資料