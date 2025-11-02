import { 
  HydrationRecord, 
  DailySummary, 
  HydrationCreate, 
  HydrationUpdate, 
  ApiResponse,
  OfflineRecord 
} from '../types';

// 錯誤類型定義
export class HydrationError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'HydrationError';
  }
}

// HTTP 客戶端配置
interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

class HydrationService {
  private baseURL = (import.meta as any).env?.VITE_API_URL || '/api';
  private defaultTimeout = 10000; // 10 seconds
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  // HTTP 客戶端核心方法
  private async request<T>(
    endpoint: string, 
    config: RequestConfig
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.defaultTimeout);

    try {
      const response = await fetch(url, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new HydrationError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.error_code || 'HTTP_ERROR',
          response.status >= 500 || response.status === 408, // 5xx 或 timeout 可重試
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof HydrationError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new HydrationError('Request timeout', 'TIMEOUT_ERROR', true);
        }
        
        if (!navigator.onLine) {
          throw new HydrationError('Network unavailable', 'NETWORK_ERROR', true);
        }
        
        throw new HydrationError(
          error.message || 'Network request failed',
          'NETWORK_ERROR',
          true
        );
      }
      
      throw new HydrationError('Unknown error occurred', 'UNKNOWN_ERROR', false);
    }
  }

  // 重試機制
  private async requestWithRetry<T>(
    endpoint: string,
    config: RequestConfig,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      return await this.request<T>(endpoint, config);
    } catch (error) {
      if (error instanceof HydrationError && error.retryable && retries > 0) {
        // 指數退避延遲
        const delay = this.retryDelay * Math.pow(2, this.maxRetries - retries);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.requestWithRetry<T>(endpoint, config, retries - 1);
      }
      throw error;
    }
  }

  // CRUD 操作方法
  async createRecord(data: HydrationCreate): Promise<HydrationRecord> {
    try {
      const response = await this.requestWithRetry<ApiResponse<HydrationRecord>>(
        '/hydration',
        {
          method: 'POST',
          body: {
            volume: data.volume,
            recorded_at: data.recorded_at?.toISOString()
          }
        }
      );

      return {
        ...response.data!,
        timestamp: new Date(response.data!.timestamp),
        synced: true
      };
    } catch (error) {
      console.error('Failed to create hydration record:', error);
      throw error;
    }
  }

  async getDailySummary(date?: string): Promise<DailySummary> {
    try {
      const queryDate = date || new Date().toISOString().split('T')[0];
      const response = await this.requestWithRetry<ApiResponse<DailySummary>>(
        `/hydration?date=${queryDate}`,
        { method: 'GET' }
      );

      return response.data!;
    } catch (error) {
      console.error('Failed to get daily summary:', error);
      throw error;
    }
  }

  async updateRecord(id: string, data: HydrationUpdate): Promise<HydrationRecord> {
    try {
      const response = await this.requestWithRetry<ApiResponse<HydrationRecord>>(
        `/hydration/${id}`,
        {
          method: 'PUT',
          body: {
            volume: data.volume,
            recorded_at: data.recorded_at?.toISOString()
          }
        }
      );

      return {
        ...response.data!,
        timestamp: new Date(response.data!.timestamp),
        synced: true
      };
    } catch (error) {
      console.error('Failed to update hydration record:', error);
      throw error;
    }
  }

  async deleteRecord(id: string): Promise<void> {
    try {
      await this.requestWithRetry<void>(
        `/hydration/${id}`,
        { method: 'DELETE' }
      );
    } catch (error) {
      console.error('Failed to delete hydration record:', error);
      throw error;
    }
  }

  // 批次操作方法（保留向後相容性）
  async syncOfflineRecords(offlineQueue: OfflineRecord[]): Promise<{
    successful: OfflineRecord[];
    failed: OfflineRecord[];
  }> {
    const { syncService } = await import('./sync.service');
    const result = await syncService.syncOfflineRecords(offlineQueue);
    
    return {
      successful: result.successful,
      failed: result.failed
    };
  }

  // 智慧同步方法
  async smartSyncOfflineRecords(
    offlineQueue: OfflineRecord[],
    networkQuality?: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'
  ): Promise<{
    successful: OfflineRecord[];
    failed: OfflineRecord[];
    conflicts: any[];
    totalProcessed: number;
  }> {
    const { syncService } = await import('./sync.service');
    return await syncService.smartSync(offlineQueue, networkQuality);
  }

  // 網路狀態檢測
  async checkNetworkStatus(): Promise<boolean> {
    if (!navigator.onLine) {
      return false;
    }

    try {
      // 嘗試發送輕量級請求檢測網路連通性
      await this.request<any>('/health', { 
        method: 'GET',
        timeout: 5000 
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // IndexedDB 離線支援方法
  async cacheRecord(record: HydrationRecord): Promise<void> {
    try {
      const { indexedDBService } = await import('./indexeddb.service');
      await indexedDBService.saveRecord(record);
    } catch (error) {
      console.error('Failed to cache record:', error);
      throw error;
    }
  }

  async syncCachedRecords(): Promise<void> {
    try {
      const { indexedDBService } = await import('./indexeddb.service');
      const offlineQueue = await indexedDBService.getOfflineQueue();
      
      if (offlineQueue.length === 0) {
        return;
      }

      const { successful, failed } = await this.syncOfflineRecords(offlineQueue);
      
      // 移除成功同步的操作
      if (successful.length > 0) {
        const successfulIds = successful.map(item => item.localId);
        await indexedDBService.removeMultipleFromOfflineQueue(successfulIds);
      }

      // 更新失敗操作的重試次數
      for (const failedItem of failed) {
        if (failedItem.retryCount < 5) { // 最多重試 5 次
          await indexedDBService.addToOfflineQueue(failedItem);
        } else {
          // 超過重試次數，移除該操作
          await indexedDBService.removeFromOfflineQueue(failedItem.localId);
          console.warn('Removed failed operation after max retries:', failedItem);
        }
      }

      console.log(`Sync completed: ${successful.length} successful, ${failed.length} failed`);
    } catch (error) {
      console.error('Failed to sync cached records:', error);
      throw error;
    }
  }

  async getCachedRecords(): Promise<HydrationRecord[]> {
    try {
      const { indexedDBService } = await import('./indexeddb.service');
      return await indexedDBService.getAllRecords();
    } catch (error) {
      console.error('Failed to get cached records:', error);
      return [];
    }
  }

  async getTodayCachedRecords(): Promise<HydrationRecord[]> {
    try {
      const { indexedDBService } = await import('./indexeddb.service');
      return await indexedDBService.getTodayRecords();
    } catch (error) {
      console.error('Failed to get today cached records:', error);
      return [];
    }
  }

  async cacheOfflineOperation(operation: OfflineRecord): Promise<void> {
    try {
      const { indexedDBService } = await import('./indexeddb.service');
      await indexedDBService.addToOfflineQueue(operation);
    } catch (error) {
      console.error('Failed to cache offline operation:', error);
      throw error;
    }
  }

  async getOfflineQueueCount(): Promise<number> {
    try {
      const { indexedDBService } = await import('./indexeddb.service');
      const queue = await indexedDBService.getOfflineQueue();
      return queue.length;
    } catch (error) {
      console.error('Failed to get offline queue count:', error);
      return 0;
    }
  }
}

export const hydrationService = new HydrationService();