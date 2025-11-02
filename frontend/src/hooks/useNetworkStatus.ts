/**
 * 網路狀態檢測 Hook
 * 實作需求 3.2, 3.4 - 網路連線狀態檢測與自動同步
 */

import { useEffect, useState, useCallback } from 'react';
import { networkService, NetworkStatus } from '../services/network.service';
import { useHydrationStore } from '../store/useHydrationStore';

export interface UseNetworkStatusReturn {
  isOnline: boolean;
  networkStatus: NetworkStatus;
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  checkConnectivity: () => Promise<boolean>;
  waitForConnection: (timeout?: number) => Promise<boolean>;
}

/**
 * 網路狀態檢測 Hook
 * 自動管理網路狀態並觸發同步操作
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(
    networkService.getStatus()
  );
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'fair' | 'poor' | 'unknown'>(
    networkService.getNetworkQuality()
  );

  const { setIsOffline, syncOfflineData } = useHydrationStore();

  /**
   * 處理上線事件
   */
  const handleOnline = useCallback(() => {
    console.log('useNetworkStatus: Device came online');
    const status = networkService.getStatus();
    setNetworkStatus(status);
    setNetworkQuality(networkService.getNetworkQuality());
    setIsOffline(false);
    
    // 延遲一點時間再同步，確保網路連線穩定
    setTimeout(() => {
      syncOfflineData().catch(error => {
        console.error('Failed to sync offline data after coming online:', error);
      });
    }, 1000);
  }, [setIsOffline, syncOfflineData]);

  /**
   * 處理離線事件
   */
  const handleOffline = useCallback(() => {
    console.log('useNetworkStatus: Device went offline');
    const status = networkService.getStatus();
    setNetworkStatus(status);
    setNetworkQuality(networkService.getNetworkQuality());
    setIsOffline(true);
  }, [setIsOffline]);

  /**
   * 處理網路連線資訊變化
   */
  const handleConnectionChange = useCallback((status: NetworkStatus) => {
    console.log('useNetworkStatus: Connection info changed', status);
    setNetworkStatus(status);
    setNetworkQuality(networkService.getNetworkQuality());
  }, []);

  /**
   * 手動檢查網路連通性
   */
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const isConnected = await networkService.checkConnectivity();
      const currentStatus = networkService.getStatus();
      
      // 如果檢測結果與當前狀態不一致，更新狀態
      if (isConnected !== currentStatus.isOnline) {
        if (isConnected) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
      
      return isConnected;
    } catch (error) {
      console.error('Failed to check connectivity:', error);
      return false;
    }
  }, [handleOnline, handleOffline]);

  /**
   * 等待網路恢復
   */
  const waitForConnection = useCallback(async (timeout: number = 30000): Promise<boolean> => {
    return networkService.waitForConnection(timeout);
  }, []);

  /**
   * 初始化網路狀態監聽
   */
  useEffect(() => {
    // 註冊網路狀態監聽器
    const unsubscribe = networkService.addListener({
      onOnline: handleOnline,
      onOffline: handleOffline,
      onConnectionChange: handleConnectionChange
    });

    // 初始化時檢查一次網路狀態
    const initialStatus = networkService.getStatus();
    setNetworkStatus(initialStatus);
    setNetworkQuality(networkService.getNetworkQuality());
    setIsOffline(!initialStatus.isOnline);

    // 如果初始狀態是在線，執行一次連通性檢查
    if (initialStatus.isOnline) {
      checkConnectivity();
    }

    // 清理函數
    return () => {
      unsubscribe();
    };
  }, [handleOnline, handleOffline, handleConnectionChange, setIsOffline, checkConnectivity]);

  /**
   * 定期檢查網路狀態（可選的額外保障）
   */
  useEffect(() => {
    // 每 5 分鐘檢查一次網路狀態，作為額外的保障
    const intervalId = setInterval(() => {
      if (networkStatus.isOnline) {
        checkConnectivity();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(intervalId);
    };
  }, [networkStatus.isOnline, checkConnectivity]);

  return {
    isOnline: networkStatus.isOnline,
    networkStatus,
    networkQuality,
    checkConnectivity,
    waitForConnection
  };
}

/**
 * 簡化版的網路狀態 Hook，只返回 isOnline 狀態
 */
export function useIsOnline(): boolean {
  const { isOnline } = useNetworkStatus();
  return isOnline;
}

/**
 * 網路品質監控 Hook
 */
export function useNetworkQuality(): {
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  isSlowConnection: boolean;
  shouldReduceDataUsage: boolean;
} {
  const { networkQuality, networkStatus } = useNetworkStatus();

  const isSlowConnection = networkQuality === 'poor' || networkQuality === 'fair';
  const shouldReduceDataUsage = isSlowConnection || (
    networkStatus.effectiveType === '2g' || 
    networkStatus.effectiveType === 'slow-2g'
  );

  return {
    quality: networkQuality,
    isSlowConnection,
    shouldReduceDataUsage
  };
}