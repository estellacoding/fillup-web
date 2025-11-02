/**
 * 資料同步與衝突解決服務
 * 實作需求 3.3, 3.4 - 時間戳優先順序解決衝突與指數退避重試策略
 */

import { HydrationRecord, OfflineRecord } from '../types';
import { hydrationService } from './hydration.service';

export interface ConflictResolution {
  strategy: 'timestamp' | 'server' | 'client' | 'merge';
  winner: 'local' | 'remote';
  resolvedRecord: HydrationRecord;
  conflictReason: string;
}

export interface SyncResult {
  successful: OfflineRecord[];
  failed: OfflineRecord[];
  conflicts: ConflictResolution[];
  totalProcessed: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffFactor: number;
  jitter: boolean;
}

class SyncService {
  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 5,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffFactor: 2,
    jitter: true
  };

  /**
   * 計算指數退避延遲時間
   */
  private calculateBackoffDelay(
    attempt: number, 
    config: RetryConfig = this.defaultRetryConfig
  ): number {
    const exponentialDelay = Math.min(
      config.baseDelay * Math.pow(config.backoffFactor, attempt),
      config.maxDelay
    );

    if (config.jitter) {
      // 添加隨機抖動以避免雷群效應
      const jitterRange = exponentialDelay * 0.1;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      return Math.max(0, exponentialDelay + jitter);
    }

    return exponentialDelay;
  }

  /**
   * 指數退避重試機制
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    config: RetryConfig = this.defaultRetryConfig,
    operationName: string = 'operation'
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateBackoffDelay(attempt - 1, config);
          console.log(`${operationName}: Retrying attempt ${attempt}/${config.maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === config.maxRetries) {
          console.error(`${operationName}: All retry attempts exhausted`, lastError);
          break;
        }

        // 檢查是否為不可重試的錯誤
        if (this.isNonRetryableError(lastError)) {
          console.error(`${operationName}: Non-retryable error encountered`, lastError);
          break;
        }

        console.warn(`${operationName}: Attempt ${attempt + 1} failed, will retry`, lastError.message);
      }
    }

    throw lastError!;
  }

  /**
   * 判斷錯誤是否不可重試
   */
  private isNonRetryableError(error: Error): boolean {
    // 4xx 錯誤通常不應該重試（除了 408, 429）
    if ('statusCode' in error) {
      const statusCode = (error as any).statusCode;
      if (statusCode >= 400 && statusCode < 500) {
        return ![408, 429].includes(statusCode);
      }
    }

    // 驗證錯誤不應該重試
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return true;
    }

    return false;
  }

  /**
   * 解決資料衝突
   */
  private resolveConflict(
    localRecord: HydrationRecord,
    remoteRecord: HydrationRecord
  ): ConflictResolution {
    // 使用時間戳優先順序策略
    const localTimestamp = new Date(localRecord.timestamp).getTime();
    const remoteTimestamp = new Date(remoteRecord.timestamp).getTime();

    let winner: 'local' | 'remote';
    let resolvedRecord: HydrationRecord;
    let conflictReason: string;

    if (localTimestamp > remoteTimestamp) {
      winner = 'local';
      resolvedRecord = localRecord;
      conflictReason = `Local record is newer (${localRecord.timestamp} > ${remoteRecord.timestamp})`;
    } else if (remoteTimestamp > localTimestamp) {
      winner = 'remote';
      resolvedRecord = remoteRecord;
      conflictReason = `Remote record is newer (${remoteRecord.timestamp} > ${localRecord.timestamp})`;
    } else {
      // 時間戳相同，比較其他屬性
      if (localRecord.volume !== remoteRecord.volume) {
        // 如果容量不同，選擇較大的值（假設使用者更可能記錄較大的值）
        winner = localRecord.volume > remoteRecord.volume ? 'local' : 'remote';
        resolvedRecord = winner === 'local' ? localRecord : remoteRecord;
        conflictReason = `Same timestamp, chose record with larger volume (${resolvedRecord.volume}ml)`;
      } else {
        // 完全相同，選擇本地記錄
        winner = 'local';
        resolvedRecord = localRecord;
        conflictReason = 'Records are identical, keeping local version';
      }
    }

    return {
      strategy: 'timestamp',
      winner,
      resolvedRecord,
      conflictReason
    };
  }

  /**
   * 同步單個離線記錄
   */
  private async syncSingleRecord(
    offlineRecord: OfflineRecord,
    retryConfig?: RetryConfig
  ): Promise<{ success: boolean; conflict?: ConflictResolution; error?: Error }> {
    try {
      await this.retryWithBackoff(async () => {
        switch (offlineRecord.action) {
          case 'create':
            const createData = offlineRecord.data as HydrationRecord;
            return await hydrationService.createRecord({
              volume: createData.volume,
              recorded_at: createData.timestamp
            });

          case 'update':
            const updateData = offlineRecord.data as Partial<HydrationRecord> & { id: string };
            return await hydrationService.updateRecord(updateData.id, {
              volume: updateData.volume,
              recorded_at: updateData.timestamp
            });

          case 'delete':
            const deleteData = offlineRecord.data as { id: string };
            await hydrationService.deleteRecord(deleteData.id);
            return null;

          default:
            throw new Error(`Unknown action: ${offlineRecord.action}`);
        }
      }, retryConfig, `Sync ${offlineRecord.action} operation`);

      return { success: true };
    } catch (error) {
      // 檢查是否為衝突錯誤（409 Conflict）
      if (error instanceof Error && 'statusCode' in error && (error as any).statusCode === 409) {
        try {
          // 嘗試獲取遠端記錄並解決衝突
          const remoteRecord = await this.fetchRemoteRecord(offlineRecord);
          if (remoteRecord && offlineRecord.action !== 'delete') {
            const localRecord = offlineRecord.data as HydrationRecord;
            const conflict = this.resolveConflict(localRecord, remoteRecord);
            
            // 如果本地記錄獲勝，重新嘗試同步
            if (conflict.winner === 'local') {
              const retryResult = await this.syncSingleRecord(offlineRecord, {
                ...this.defaultRetryConfig,
                maxRetries: 1 // 衝突解決後只重試一次
              });
              return { ...retryResult, conflict };
            }
            
            return { success: true, conflict };
          }
        } catch (conflictError) {
          console.error('Failed to resolve conflict:', conflictError);
        }
      }

      return { 
        success: false, 
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * 獲取遠端記錄（用於衝突解決）
   */
  private async fetchRemoteRecord(_offlineRecord: OfflineRecord): Promise<HydrationRecord | null> {
    try {
      // 這裡需要實作獲取特定記錄的 API
      // 暫時返回 null，實際實作需要後端支援
      console.warn('fetchRemoteRecord not implemented, conflict resolution may be incomplete');
      return null;
    } catch (error) {
      console.error('Failed to fetch remote record for conflict resolution:', error);
      return null;
    }
  }

  /**
   * 批次同步離線記錄
   */
  public async syncOfflineRecords(
    offlineQueue: OfflineRecord[],
    retryConfig?: RetryConfig
  ): Promise<SyncResult> {
    const result: SyncResult = {
      successful: [],
      failed: [],
      conflicts: [],
      totalProcessed: 0
    };

    if (offlineQueue.length === 0) {
      return result;
    }

    console.log(`Starting sync of ${offlineQueue.length} offline records`);

    // 按時間戳排序，確保操作順序正確
    const sortedQueue = [...offlineQueue].sort((a, b) => a.timestamp - b.timestamp);

    for (const offlineRecord of sortedQueue) {
      result.totalProcessed++;

      try {
        const syncResult = await this.syncSingleRecord(offlineRecord, retryConfig);

        if (syncResult.success) {
          result.successful.push(offlineRecord);
          if (syncResult.conflict) {
            result.conflicts.push(syncResult.conflict);
          }
        } else {
          result.failed.push({
            ...offlineRecord,
            retryCount: offlineRecord.retryCount + 1
          });
        }
      } catch (error) {
        console.error(`Failed to sync record ${offlineRecord.localId}:`, error);
        result.failed.push({
          ...offlineRecord,
          retryCount: offlineRecord.retryCount + 1
        });
      }
    }

    console.log(`Sync completed: ${result.successful.length} successful, ${result.failed.length} failed, ${result.conflicts.length} conflicts resolved`);

    return result;
  }

  /**
   * 智慧同步策略
   * 根據網路狀況和記錄數量調整同步行為
   */
  public async smartSync(
    offlineQueue: OfflineRecord[],
    networkQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' = 'unknown'
  ): Promise<SyncResult> {
    // 根據網路品質調整重試配置
    let retryConfig = { ...this.defaultRetryConfig };

    switch (networkQuality) {
      case 'excellent':
        retryConfig.maxRetries = 5;
        retryConfig.baseDelay = 500;
        break;
      case 'good':
        retryConfig.maxRetries = 4;
        retryConfig.baseDelay = 1000;
        break;
      case 'fair':
        retryConfig.maxRetries = 3;
        retryConfig.baseDelay = 2000;
        break;
      case 'poor':
        retryConfig.maxRetries = 2;
        retryConfig.baseDelay = 5000;
        retryConfig.maxDelay = 60000; // 1 minute
        break;
      default:
        // 使用預設配置
        break;
    }

    // 如果記錄太多，分批處理
    if (offlineQueue.length > 10) {
      const batchSize = networkQuality === 'poor' ? 3 : 5;
      const batches: OfflineRecord[][] = [];
      
      for (let i = 0; i < offlineQueue.length; i += batchSize) {
        batches.push(offlineQueue.slice(i, i + batchSize));
      }

      const combinedResult: SyncResult = {
        successful: [],
        failed: [],
        conflicts: [],
        totalProcessed: 0
      };

      for (const batch of batches) {
        const batchResult = await this.syncOfflineRecords(batch, retryConfig);
        
        combinedResult.successful.push(...batchResult.successful);
        combinedResult.failed.push(...batchResult.failed);
        combinedResult.conflicts.push(...batchResult.conflicts);
        combinedResult.totalProcessed += batchResult.totalProcessed;

        // 批次間稍作延遲，避免過載
        if (networkQuality === 'poor' || networkQuality === 'fair') {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      return combinedResult;
    }

    return this.syncOfflineRecords(offlineQueue, retryConfig);
  }

  /**
   * 檢查是否需要同步
   */
  public shouldSync(offlineQueue: OfflineRecord[], isOnline: boolean): boolean {
    if (!isOnline || offlineQueue.length === 0) {
      return false;
    }

    // 檢查是否有記錄超過重試次數限制
    const hasExceededRetries = offlineQueue.some(record => record.retryCount >= this.defaultRetryConfig.maxRetries);
    
    if (hasExceededRetries) {
      console.warn('Some records have exceeded retry limits, sync needed for cleanup');
      return true;
    }

    return true;
  }

  /**
   * 清理超過重試次數的記錄
   */
  public filterExceededRetries(offlineQueue: OfflineRecord[]): {
    retryable: OfflineRecord[];
    exceeded: OfflineRecord[];
  } {
    const retryable: OfflineRecord[] = [];
    const exceeded: OfflineRecord[] = [];

    offlineQueue.forEach(record => {
      if (record.retryCount >= this.defaultRetryConfig.maxRetries) {
        exceeded.push(record);
      } else {
        retryable.push(record);
      }
    });

    return { retryable, exceeded };
  }
}

export const syncService = new SyncService();