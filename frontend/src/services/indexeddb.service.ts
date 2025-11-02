/**
 * IndexedDB 離線快取服務
 * 提供飲水記錄的本地持久化儲存與同步佇列管理
 */

import { HydrationRecord, OfflineRecord } from '../types';

// IndexedDB 配置
const DB_NAME = 'FillUpDB';
const DB_VERSION = 1;

// 物件儲存庫名稱
const STORES = {
  HYDRATION_RECORDS: 'hydrationRecords',
  OFFLINE_QUEUE: 'offlineQueue',
  SETTINGS: 'settings'
} as const;

export class IndexedDBService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initDB();
  }

  /**
   * 初始化 IndexedDB 資料庫
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 建立飲水記錄儲存庫
        if (!db.objectStoreNames.contains(STORES.HYDRATION_RECORDS)) {
          const recordStore = db.createObjectStore(STORES.HYDRATION_RECORDS, {
            keyPath: 'id'
          });
          recordStore.createIndex('timestamp', 'timestamp', { unique: false });
          recordStore.createIndex('synced', 'synced', { unique: false });
        }

        // 建立離線佇列儲存庫
        if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, {
            keyPath: 'localId'
          });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('action', 'action', { unique: false });
        }

        // 建立設定儲存庫
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, {
            keyPath: 'key'
          });
        }
      };
    });
  }

  /**
   * 確保資料庫已初始化
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (this.initPromise) {
      await this.initPromise;
      this.initPromise = null;
    }

    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return this.db;
  }

  /**
   * 執行資料庫交易
   */
  private async transaction<T>(
    storeNames: string | string[],
    mode: IDBTransactionMode,
    callback: (stores: IDBObjectStore | IDBObjectStore[]) => Promise<T> | T
  ): Promise<T> {
    const db = await this.ensureDB();
    const transaction = db.transaction(storeNames, mode);
    
    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
      
      const stores = Array.isArray(storeNames)
        ? storeNames.map(name => transaction.objectStore(name))
        : transaction.objectStore(storeNames);

      try {
        const result = callback(stores);
        if (result instanceof Promise) {
          result.then(resolve).catch(reject);
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  // ==================== 飲水記錄操作 ====================

  /**
   * 儲存飲水記錄
   */
  async saveRecord(record: HydrationRecord): Promise<void> {
    await this.transaction(
      STORES.HYDRATION_RECORDS,
      'readwrite',
      (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = (store as IDBObjectStore).put({
            ...record,
            timestamp: record.timestamp.getTime() // 儲存為時間戳
          });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * 批次儲存飲水記錄
   */
  async saveRecords(records: HydrationRecord[]): Promise<void> {
    await this.transaction(
      STORES.HYDRATION_RECORDS,
      'readwrite',
      (store) => {
        return Promise.all(
          records.map(record => 
            new Promise<void>((resolve, reject) => {
              const request = (store as IDBObjectStore).put({
                ...record,
                timestamp: record.timestamp.getTime()
              });
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
            })
          )
        );
      }
    );
  }

  /**
   * 取得所有飲水記錄
   */
  async getAllRecords(): Promise<HydrationRecord[]> {
    return this.transaction(
      STORES.HYDRATION_RECORDS,
      'readonly',
      (store) => {
        return new Promise<HydrationRecord[]>((resolve, reject) => {
          const request = (store as IDBObjectStore).getAll();
          request.onsuccess = () => {
            const records = request.result.map((record: any) => ({
              ...record,
              timestamp: new Date(record.timestamp)
            }));
            resolve(records);
          };
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * 根據日期範圍取得記錄
   */
  async getRecordsByDateRange(startDate: Date, endDate: Date): Promise<HydrationRecord[]> {
    return this.transaction(
      STORES.HYDRATION_RECORDS,
      'readonly',
      (store) => {
        return new Promise<HydrationRecord[]>((resolve, reject) => {
          const index = (store as IDBObjectStore).index('timestamp');
          const range = IDBKeyRange.bound(startDate.getTime(), endDate.getTime());
          const request = index.getAll(range);
          
          request.onsuccess = () => {
            const records = request.result.map((record: any) => ({
              ...record,
              timestamp: new Date(record.timestamp)
            }));
            resolve(records);
          };
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * 取得今日記錄
   */
  async getTodayRecords(): Promise<HydrationRecord[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return this.getRecordsByDateRange(startOfDay, endOfDay);
  }

  /**
   * 更新飲水記錄
   */
  async updateRecord(id: string, updates: Partial<HydrationRecord>): Promise<void> {
    await this.transaction(
      STORES.HYDRATION_RECORDS,
      'readwrite',
      (store) => {
        return new Promise<void>((resolve, reject) => {
          const getRequest = (store as IDBObjectStore).get(id);
          
          getRequest.onsuccess = () => {
            const existingRecord = getRequest.result;
            if (!existingRecord) {
              reject(new Error('Record not found'));
              return;
            }

            const updatedRecord = {
              ...existingRecord,
              ...updates,
              timestamp: updates.timestamp ? updates.timestamp.getTime() : existingRecord.timestamp
            };

            const putRequest = (store as IDBObjectStore).put(updatedRecord);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
          };
          
          getRequest.onerror = () => reject(getRequest.error);
        });
      }
    );
  }

  /**
   * 刪除飲水記錄
   */
  async deleteRecord(id: string): Promise<void> {
    await this.transaction(
      STORES.HYDRATION_RECORDS,
      'readwrite',
      (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = (store as IDBObjectStore).delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  // ==================== 離線佇列操作 ====================

  /**
   * 新增離線操作到佇列
   */
  async addToOfflineQueue(operation: OfflineRecord): Promise<void> {
    await this.transaction(
      STORES.OFFLINE_QUEUE,
      'readwrite',
      (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = (store as IDBObjectStore).put(operation);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * 取得所有離線佇列操作
   */
  async getOfflineQueue(): Promise<OfflineRecord[]> {
    return this.transaction(
      STORES.OFFLINE_QUEUE,
      'readonly',
      (store) => {
        return new Promise<OfflineRecord[]>((resolve, reject) => {
          const request = (store as IDBObjectStore).getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * 從離線佇列移除操作
   */
  async removeFromOfflineQueue(localId: string): Promise<void> {
    await this.transaction(
      STORES.OFFLINE_QUEUE,
      'readwrite',
      (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = (store as IDBObjectStore).delete(localId);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * 批次移除離線佇列操作
   */
  async removeMultipleFromOfflineQueue(localIds: string[]): Promise<void> {
    await this.transaction(
      STORES.OFFLINE_QUEUE,
      'readwrite',
      (store) => {
        return Promise.all(
          localIds.map(localId =>
            new Promise<void>((resolve, reject) => {
              const request = (store as IDBObjectStore).delete(localId);
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
            })
          )
        );
      }
    );
  }

  /**
   * 更新離線佇列項目
   */
  async updateOfflineQueueItem(operation: OfflineRecord): Promise<void> {
    await this.transaction(
      STORES.OFFLINE_QUEUE,
      'readwrite',
      (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = (store as IDBObjectStore).put(operation);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * 清空離線佇列
   */
  async clearOfflineQueue(): Promise<void> {
    await this.transaction(
      STORES.OFFLINE_QUEUE,
      'readwrite',
      (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = (store as IDBObjectStore).clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  // ==================== 設定操作 ====================

  /**
   * 儲存設定
   */
  async saveSetting(key: string, value: any): Promise<void> {
    await this.transaction(
      STORES.SETTINGS,
      'readwrite',
      (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = (store as IDBObjectStore).put({ key, value });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * 取得設定
   */
  async getSetting(key: string): Promise<any> {
    return this.transaction(
      STORES.SETTINGS,
      'readonly',
      (store) => {
        return new Promise<any>((resolve, reject) => {
          const request = (store as IDBObjectStore).get(key);
          request.onsuccess = () => {
            resolve(request.result?.value);
          };
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * 取得所有設定
   */
  async getAllSettings(): Promise<Record<string, any>> {
    return this.transaction(
      STORES.SETTINGS,
      'readonly',
      (store) => {
        return new Promise<Record<string, any>>((resolve, reject) => {
          const request = (store as IDBObjectStore).getAll();
          request.onsuccess = () => {
            const settings: Record<string, any> = {};
            request.result.forEach((item: any) => {
              settings[item.key] = item.value;
            });
            resolve(settings);
          };
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  // ==================== 資料庫管理 ====================

  /**
   * 清空所有資料
   */
  async clearAllData(): Promise<void> {
    const storeNames = [STORES.HYDRATION_RECORDS, STORES.OFFLINE_QUEUE, STORES.SETTINGS];
    
    await this.transaction(
      storeNames,
      'readwrite',
      (stores) => {
        return Promise.all(
          (stores as IDBObjectStore[]).map(store =>
            new Promise<void>((resolve, reject) => {
              const request = store.clear();
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
            })
          )
        );
      }
    );
  }

  /**
   * 取得資料庫統計資訊
   */
  async getStats(): Promise<{
    recordCount: number;
    queueCount: number;
    settingCount: number;
  }> {
    const storeNames = [STORES.HYDRATION_RECORDS, STORES.OFFLINE_QUEUE, STORES.SETTINGS];
    
    return this.transaction(
      storeNames,
      'readonly',
      (stores) => {
        return Promise.all(
          (stores as IDBObjectStore[]).map(store =>
            new Promise<number>((resolve, reject) => {
              const request = store.count();
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            })
          )
        ).then(([recordCount, queueCount, settingCount]) => ({
          recordCount,
          queueCount,
          settingCount
        }));
      }
    );
  }

  /**
   * 關閉資料庫連線
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// 單例實例
export const indexedDBService = new IndexedDBService();