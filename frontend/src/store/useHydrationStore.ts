import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { HydrationRecord, OfflineRecord, SyncStatus } from '../types';

interface HydrationState {
  // 狀態
  dailyIntake: number;
  dailyGoal: number;
  records: HydrationRecord[];
  isLoading: boolean;
  isOffline: boolean;
  offlineQueue: OfflineRecord[];
  syncStatus: SyncStatus;
  lastUpdated: Date | null;
  
  // 動作
  addIntake: (volume: number) => Promise<void>;
  updateRecord: (id: string, updates: Partial<HydrationRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  syncOfflineData: () => Promise<void>;
  setDailyGoal: (goal: number) => void;
  setIsLoading: (loading: boolean) => void;
  setIsOffline: (offline: boolean) => void;
  loadFromCache: () => Promise<void>;
  saveToCache: () => Promise<void>;
  addToOfflineQueue: (action: OfflineRecord) => void;
  clearOfflineQueue: () => void;
  calculateDailyIntake: () => void;
  initializeNetworkListener: () => void;
}

// 本地儲存鍵值
const STORAGE_KEYS = {
  RECORDS: 'hydration_records',
  SETTINGS: 'hydration_settings',
  OFFLINE_QUEUE: 'hydration_offline_queue'
} as const;

export const useHydrationStore = create<HydrationState>()(
  subscribeWithSelector(
    immer((set, get) => ({
    // 初始狀態
    dailyIntake: 0,
    dailyGoal: 2000,
    records: [],
    isLoading: false,
    isOffline: !navigator.onLine,
    offlineQueue: [],
    syncStatus: {
      isOnline: navigator.onLine,
      pendingCount: 0,
      isSyncing: false
    },
    lastUpdated: null,

    // 動作實作
    addIntake: async (volume: number) => {
      const { isOffline, addToOfflineQueue, saveToCache } = get();
      set((state) => {
        state.isLoading = true;
      });
      
      try {
        // 驗證輸入
        const { errorService } = await import('../services/error.service');
        const volumeValidation = errorService.validateVolume(volume);
        if (!volumeValidation.valid) {
          throw volumeValidation.error;
        }

        const newRecord: HydrationRecord = {
          id: crypto.randomUUID(),
          volume,
          timestamp: new Date(),
          synced: !isOffline,
          localId: crypto.randomUUID()
        };
        
        set((state) => {
          state.records.push(newRecord);
          state.lastUpdated = new Date();
        });
        
        // 重新計算每日攝取量
        get().calculateDailyIntake();
        
        // 如果離線，加入離線佇列
        if (isOffline) {
          addToOfflineQueue({
            localId: newRecord.localId!,
            action: 'create',
            data: newRecord,
            timestamp: Date.now(),
            retryCount: 0
          });
        }
        
        // 儲存到本地快取
        await saveToCache();
        
        // 顯示成功訊息
        errorService.showSuccess(
          '記錄成功',
          `已記錄 ${volume}ml 飲水量${isOffline ? '（離線模式）' : ''}`
        );
        
      } catch (error) {
        const { errorService } = await import('../services/error.service');
        errorService.handleError(error, { volume, operation: 'addIntake' });
        throw error;
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    updateRecord: async (id: string, updates: Partial<HydrationRecord>) => {
      const { isOffline, addToOfflineQueue, saveToCache } = get();
      set((state) => {
        state.isLoading = true;
      });
      
      try {
        // 驗證輸入
        const { errorService } = await import('../services/error.service');
        if (updates.volume !== undefined) {
          const volumeValidation = errorService.validateVolume(updates.volume);
          if (!volumeValidation.valid) {
            throw volumeValidation.error;
          }
        }
        if (updates.timestamp !== undefined) {
          const timestampValidation = errorService.validateTimestamp(updates.timestamp);
          if (!timestampValidation.valid) {
            throw timestampValidation.error;
          }
        }

        const recordIndex = get().records.findIndex(record => record.id === id);
        
        if (recordIndex === -1) {
          throw new Error('Record not found');
        }
        
        set((state) => {
          const record = state.records[recordIndex];
          Object.assign(record, updates, { synced: !isOffline });
          state.lastUpdated = new Date();
        });
        
        // 重新計算每日攝取量
        get().calculateDailyIntake();
        
        // 如果離線，加入離線佇列
        if (isOffline) {
          const updatedRecord = get().records[recordIndex];
          addToOfflineQueue({
            localId: updatedRecord.localId || crypto.randomUUID(),
            action: 'update',
            data: { id, ...updates },
            timestamp: Date.now(),
            retryCount: 0
          });
        }
        
        // 儲存到本地快取
        await saveToCache();
        
        // 顯示成功訊息
        errorService.showSuccess(
          '更新成功',
          `記錄已更新${isOffline ? '（離線模式）' : ''}`
        );
        
      } catch (error) {
        const { errorService } = await import('../services/error.service');
        errorService.handleError(error, { id, updates, operation: 'updateRecord' });
        throw error;
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    deleteRecord: async (id: string) => {
      const { isOffline, addToOfflineQueue, saveToCache } = get();
      set((state) => {
        state.isLoading = true;
      });
      
      try {
        const recordToDelete = get().records.find(record => record.id === id);
        
        if (!recordToDelete) {
          throw new Error('Record not found');
        }
        
        set((state) => {
          const index = state.records.findIndex(record => record.id === id);
          if (index !== -1) {
            state.records.splice(index, 1);
          }
          state.lastUpdated = new Date();
        });
        
        // 重新計算每日攝取量
        get().calculateDailyIntake();
        
        // 如果離線，加入離線佇列
        if (isOffline) {
          addToOfflineQueue({
            localId: recordToDelete.localId || crypto.randomUUID(),
            action: 'delete',
            data: { id },
            timestamp: Date.now(),
            retryCount: 0
          });
        }
        
        // 儲存到本地快取
        await saveToCache();
        
        // 顯示成功訊息
        const { errorService } = await import('../services/error.service');
        errorService.showSuccess(
          '刪除成功',
          `記錄已刪除${isOffline ? '（離線模式）' : ''}`
        );
        
      } catch (error) {
        const { errorService } = await import('../services/error.service');
        errorService.handleError(error, { id, operation: 'deleteRecord' });
        throw error;
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    syncOfflineData: async () => {
      const { offlineQueue, isOffline } = get();
      
      if (isOffline || offlineQueue.length === 0) {
        return;
      }
      
      set(state => ({
        syncStatus: { ...state.syncStatus, isSyncing: true }
      }));
      
      try {
        // 使用智慧同步服務
        const { syncService } = await import('../services/sync.service');
        const { networkService } = await import('../services/network.service');
        
        // 獲取網路品質資訊
        const networkQuality = networkService.getNetworkQuality();
        
        // 過濾超過重試次數的記錄
        const { retryable, exceeded } = syncService.filterExceededRetries(offlineQueue);
        
        if (exceeded.length > 0) {
          console.warn(`Removing ${exceeded.length} records that exceeded retry limits`);
          // 從 IndexedDB 中移除超過重試次數的記錄
          const { indexedDBService } = await import('../services/indexeddb.service');
          for (const record of exceeded) {
            await indexedDBService.removeFromOfflineQueue(record.localId);
          }
        }
        
        // 同步可重試的記錄
        if (retryable.length > 0) {
          const syncResult = await syncService.smartSync(retryable, networkQuality);
          
          // 更新 IndexedDB
          const { indexedDBService } = await import('../services/indexeddb.service');
          
          // 移除成功同步的記錄
          if (syncResult.successful.length > 0) {
            const successfulIds = syncResult.successful.map(item => item.localId);
            await indexedDBService.removeMultipleFromOfflineQueue(successfulIds);
          }
          
          // 更新失敗記錄的重試次數
          for (const failedItem of syncResult.failed) {
            await indexedDBService.updateOfflineQueueItem(failedItem);
          }
          
          // 記錄衝突解決結果
          if (syncResult.conflicts.length > 0) {
            console.log(`Resolved ${syncResult.conflicts.length} conflicts during sync`);
            syncResult.conflicts.forEach(conflict => {
              console.log(`Conflict resolved: ${conflict.conflictReason}`);
            });
          }
        }
        
        // 重新載入離線佇列狀態
        const { indexedDBService } = await import('../services/indexeddb.service');
        const updatedQueue = await indexedDBService.getOfflineQueue();
        
        set(state => ({
          offlineQueue: updatedQueue,
          syncStatus: {
            ...state.syncStatus,
            lastSyncAt: new Date(),
            pendingCount: updatedQueue.length,
            syncError: undefined
          }
        }));
        
      } catch (error) {
        console.error('Failed to sync offline data:', error);
        set(state => ({
          syncStatus: {
            ...state.syncStatus,
            syncError: error instanceof Error ? error.message : 'Sync failed'
          }
        }));
      } finally {
        set(state => ({
          syncStatus: { ...state.syncStatus, isSyncing: false }
        }));
      }
    },

    setDailyGoal: (goal: number) => {
      set((state) => {
        state.dailyGoal = goal;
      });
      get().saveToCache();
    },

    setIsLoading: (loading: boolean) => {
      set((state) => {
        state.isLoading = loading;
      });
    },

    setIsOffline: (offline: boolean) => {
      set((state) => {
        state.isOffline = offline;
        state.syncStatus.isOnline = !offline;
      });
      
      // 如果重新上線，嘗試同步
      if (!offline) {
        get().syncOfflineData();
      }
    },

    loadFromCache: async () => {
      try {
        const { indexedDBService } = await import('../services/indexeddb.service');
        
        // 載入飲水記錄
        const records = await indexedDBService.getAllRecords();
        set((state) => {
          state.records = records;
        });
        get().calculateDailyIntake();
        
        // 載入設定
        const dailyGoal = await indexedDBService.getSetting('dailyGoal');
        if (dailyGoal) {
          set((state) => {
            state.dailyGoal = dailyGoal;
          });
        }
        
        // 載入離線佇列
        const offlineQueue = await indexedDBService.getOfflineQueue();
        set((state) => {
          state.offlineQueue = offlineQueue;
          state.syncStatus.pendingCount = offlineQueue.length;
        });
        
      } catch (error) {
        console.error('Failed to load from cache:', error);
        // 降級到 localStorage
        try {
          const cachedRecords = localStorage.getItem(STORAGE_KEYS.RECORDS);
          if (cachedRecords) {
            const records: HydrationRecord[] = JSON.parse(cachedRecords).map((record: any) => ({
              ...record,
              timestamp: new Date(record.timestamp)
            }));
            set((state) => {
              state.records = records;
            });
            get().calculateDailyIntake();
          }
        } catch (fallbackError) {
          console.error('Failed to load from localStorage fallback:', fallbackError);
        }
      }
    },

    saveToCache: async () => {
      try {
        const { records, dailyGoal } = get();
        const { indexedDBService } = await import('../services/indexeddb.service');
        
        // 儲存飲水記錄
        await indexedDBService.saveRecords(records);
        
        // 儲存設定
        await indexedDBService.saveSetting('dailyGoal', dailyGoal);
        
        // 離線佇列已在其他操作中單獨管理，這裡不需要批次儲存
        
      } catch (error) {
        console.error('Failed to save to cache:', error);
        // 降級到 localStorage
        try {
          const { records, dailyGoal, offlineQueue } = get();
          localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ dailyGoal }));
          localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(offlineQueue));
        } catch (fallbackError) {
          console.error('Failed to save to localStorage fallback:', fallbackError);
        }
      }
    },

    addToOfflineQueue: (action: OfflineRecord) => {
      set((state) => {
        state.offlineQueue.push(action);
        state.syncStatus.pendingCount = state.offlineQueue.length;
      });
      
      // 異步儲存到 IndexedDB
      (async () => {
        try {
          const { indexedDBService } = await import('../services/indexeddb.service');
          await indexedDBService.addToOfflineQueue(action);
        } catch (error) {
          console.error('Failed to save offline operation to IndexedDB:', error);
        }
      })();
    },

    clearOfflineQueue: () => {
      set((state) => {
        state.offlineQueue = [];
        state.syncStatus.pendingCount = 0;
      });
      get().saveToCache();
    },

    calculateDailyIntake: () => {
      const { records } = get();
      const today = new Date().toDateString();
      
      const todayRecords = records.filter(record => 
        record.timestamp.toDateString() === today
      );
      
      const dailyIntake = todayRecords.reduce((sum, record) => sum + record.volume, 0);
      set((state) => {
        state.dailyIntake = dailyIntake;
      });
    },

    initializeNetworkListener: () => {
      // 使用新的 networkService 而不是直接監聽 window 事件
      import('../services/network.service').then(({ networkService }) => {
        const unsubscribe = networkService.addListener({
          onOnline: () => {
            get().setIsOffline(false);
            // 網路恢復時自動同步
            setTimeout(() => {
              get().syncOfflineData().catch((error: any) => {
                console.error('Auto-sync failed after network recovery:', error);
              });
            }, 1000);
          },
          onOffline: () => {
            get().setIsOffline(true);
          }
        });

        // 初始化網路狀態
        const initialStatus = networkService.getStatus();
        get().setIsOffline(!initialStatus.isOnline);

        // 返回清理函數
        return unsubscribe;
      }).catch((error: any) => {
        console.error('Failed to initialize network listener:', error);
        
        // 降級到基本的 window 事件監聽
        const handleOnline = () => get().setIsOffline(false);
        const handleOffline = () => get().setIsOffline(true);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      });
    }
    }))
  )
);