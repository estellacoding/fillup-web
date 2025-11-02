/**
 * 網路狀態檢測與管理服務
 * 實作需求 3.2, 3.4 - 網路連線狀態檢測與自動同步
 */

export interface NetworkStatus {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export interface NetworkEventListener {
  onOnline: () => void;
  onOffline: () => void;
  onConnectionChange?: (status: NetworkStatus) => void;
}

class NetworkService {
  private listeners: Set<NetworkEventListener> = new Set();
  private currentStatus: NetworkStatus = {
    isOnline: navigator.onLine
  };
  private healthCheckInterval: number | null = null;
  private healthCheckUrl = '/api/health';
  private healthCheckIntervalMs = 30000; // 30 seconds

  constructor() {
    this.initializeEventListeners();
    this.updateNetworkInfo();
  }

  /**
   * 初始化瀏覽器網路事件監聽器
   */
  private initializeEventListeners(): void {
    // 基本的線上/離線事件
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // 網路連線資訊變化事件 (如果支援)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener('change', this.handleConnectionChange);
      }
    }
  }

  /**
   * 處理上線事件
   */
  private handleOnline = (): void => {
    console.log('Network: Online event detected');
    this.updateNetworkStatus(true);
    this.notifyListeners('online');
    this.startHealthCheck();
  };

  /**
   * 處理離線事件
   */
  private handleOffline = (): void => {
    console.log('Network: Offline event detected');
    this.updateNetworkStatus(false);
    this.notifyListeners('offline');
    this.stopHealthCheck();
  };

  /**
   * 處理網路連線資訊變化
   */
  private handleConnectionChange = (): void => {
    this.updateNetworkInfo();
    this.notifyListeners('connectionChange');
  };

  /**
   * 更新網路狀態
   */
  private updateNetworkStatus(isOnline: boolean): void {
    this.currentStatus = {
      ...this.currentStatus,
      isOnline
    };
  }

  /**
   * 更新網路連線詳細資訊
   */
  private updateNetworkInfo(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        this.currentStatus = {
          ...this.currentStatus,
          connectionType: connection.type,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        };
      }
    }
  }

  /**
   * 通知所有監聽器
   */
  private notifyListeners(eventType: 'online' | 'offline' | 'connectionChange'): void {
    this.listeners.forEach(listener => {
      try {
        switch (eventType) {
          case 'online':
            listener.onOnline();
            break;
          case 'offline':
            listener.onOffline();
            break;
          case 'connectionChange':
            if (listener.onConnectionChange) {
              listener.onConnectionChange(this.currentStatus);
            }
            break;
        }
      } catch (error) {
        console.error('Error notifying network listener:', error);
      }
    });
  }

  /**
   * 開始健康檢查
   */
  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      return;
    }

    this.healthCheckInterval = window.setInterval(async () => {
      const isHealthy = await this.performHealthCheck();
      if (!isHealthy && this.currentStatus.isOnline) {
        // 健康檢查失敗但瀏覽器認為在線，可能是網路問題
        console.warn('Network: Health check failed, treating as offline');
        this.handleOffline();
      }
    }, this.healthCheckIntervalMs);
  }

  /**
   * 停止健康檢查
   */
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * 執行健康檢查
   */
  private async performHealthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(this.healthCheckUrl, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * 註冊網路狀態監聽器
   */
  public addListener(listener: NetworkEventListener): () => void {
    this.listeners.add(listener);
    
    // 返回取消註冊函數
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 移除網路狀態監聽器
   */
  public removeListener(listener: NetworkEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * 獲取當前網路狀態
   */
  public getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  /**
   * 檢查是否在線
   */
  public isOnline(): boolean {
    return this.currentStatus.isOnline;
  }

  /**
   * 手動檢查網路連通性
   */
  public async checkConnectivity(): Promise<boolean> {
    // 首先檢查瀏覽器的 navigator.onLine
    if (!navigator.onLine) {
      return false;
    }

    // 然後執行實際的網路請求測試
    return await this.performHealthCheck();
  }

  /**
   * 等待網路恢復
   */
  public async waitForConnection(timeout: number = 30000): Promise<boolean> {
    if (this.isOnline()) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeout);

      const listener: NetworkEventListener = {
        onOnline: () => {
          cleanup();
          resolve(true);
        },
        onOffline: () => {
          // Do nothing, keep waiting
        }
      };

      const cleanup = () => {
        clearTimeout(timeoutId);
        this.removeListener(listener);
      };

      this.addListener(listener);
    });
  }

  /**
   * 獲取網路品質評估
   */
  public getNetworkQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' {
    if (!this.currentStatus.isOnline) {
      return 'poor';
    }

    const { effectiveType, rtt, downlink } = this.currentStatus;

    if (!effectiveType) {
      return 'unknown';
    }

    // 基於 effectiveType 的簡單評估
    switch (effectiveType) {
      case '4g':
        return 'excellent';
      case '3g':
        return 'good';
      case '2g':
        return 'fair';
      case 'slow-2g':
        return 'poor';
      default:
        // 如果有 RTT 和下載速度資訊，使用更精確的評估
        if (rtt !== undefined && downlink !== undefined) {
          if (rtt < 100 && downlink > 10) return 'excellent';
          if (rtt < 300 && downlink > 1.5) return 'good';
          if (rtt < 1000 && downlink > 0.5) return 'fair';
          return 'poor';
        }
        return 'unknown';
    }
  }

  /**
   * 清理資源
   */
  public destroy(): void {
    this.stopHealthCheck();
    
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.removeEventListener('change', this.handleConnectionChange);
      }
    }

    this.listeners.clear();
  }
}

// 單例實例
export const networkService = new NetworkService();