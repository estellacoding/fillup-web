/**
 * 簡單的 Zustand store 測試
 * 驗證核心功能是否正常運作
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useHydrationStore } from '../store/useHydrationStore';

describe('HydrationStore', () => {
  beforeEach(() => {
    // 重置 store 狀態
    useHydrationStore.setState({
      dailyIntake: 0,
      dailyGoal: 2000,
      records: [],
      isLoading: false,
      isOffline: false,
      offlineQueue: [],
      syncStatus: {
        isOnline: true,
        pendingCount: 0,
        isSyncing: false
      },
      lastUpdated: null
    });
  });

  it('should initialize with default values', () => {
    const state = useHydrationStore.getState();
    
    expect(state.dailyIntake).toBe(0);
    expect(state.dailyGoal).toBe(2000);
    expect(state.records).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.isOffline).toBe(false);
  });

  it('should set daily goal', () => {
    const { setDailyGoal } = useHydrationStore.getState();
    
    setDailyGoal(2500);
    
    const state = useHydrationStore.getState();
    expect(state.dailyGoal).toBe(2500);
  });

  it('should set loading state', () => {
    const { setIsLoading } = useHydrationStore.getState();
    
    setIsLoading(true);
    
    const state = useHydrationStore.getState();
    expect(state.isLoading).toBe(true);
  });

  it('should set offline state', () => {
    const { setIsOffline } = useHydrationStore.getState();
    
    setIsOffline(true);
    
    const state = useHydrationStore.getState();
    expect(state.isOffline).toBe(true);
    expect(state.syncStatus.isOnline).toBe(false);
  });

  it('should calculate daily intake correctly', () => {
    const { calculateDailyIntake } = useHydrationStore.getState();
    const today = new Date();
    
    // 設定一些今日記錄
    useHydrationStore.setState({
      records: [
        {
          id: '1',
          volume: 250,
          timestamp: today,
          synced: true
        },
        {
          id: '2',
          volume: 350,
          timestamp: today,
          synced: true
        },
        {
          id: '3',
          volume: 200,
          timestamp: new Date(today.getTime() - 24 * 60 * 60 * 1000), // 昨天
          synced: true
        }
      ]
    });
    
    calculateDailyIntake();
    
    const state = useHydrationStore.getState();
    expect(state.dailyIntake).toBe(600); // 只計算今日的 250 + 350
  });
});