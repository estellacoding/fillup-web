/**
 * 錯誤處理 Hook
 * 提供統一的錯誤處理與使用者回饋介面
 */

import { useCallback } from 'react';
import { errorService, ErrorInfo } from '../services/error.service';

export interface UseErrorHandlerReturn {
  handleError: (error: any, context?: Record<string, any>) => ErrorInfo;
  showSuccess: (title: string, message: string, duration?: number) => void;
  showInfo: (title: string, message: string, duration?: number) => void;
  showWarning: (title: string, message: string, duration?: number) => void;
  validateVolume: (volume: number) => { valid: boolean; error?: ErrorInfo };
  validateTimestamp: (timestamp: Date) => { valid: boolean; error?: ErrorInfo };
}

/**
 * 錯誤處理 Hook
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const handleError = useCallback((error: any, context?: Record<string, any>): ErrorInfo => {
    return errorService.handleError(error, context);
  }, []);

  const showSuccess = useCallback((title: string, message: string, duration?: number) => {
    errorService.showSuccess(title, message, duration);
  }, []);

  const showInfo = useCallback((title: string, message: string, duration?: number) => {
    errorService.showInfo(title, message, duration);
  }, []);

  const showWarning = useCallback((title: string, message: string, duration?: number) => {
    errorService.showWarning(title, message, duration);
  }, []);

  const validateVolume = useCallback((volume: number) => {
    return errorService.validateVolume(volume);
  }, []);

  const validateTimestamp = useCallback((timestamp: Date) => {
    return errorService.validateTimestamp(timestamp);
  }, []);

  return {
    handleError,
    showSuccess,
    showInfo,
    showWarning,
    validateVolume,
    validateTimestamp
  };
}

/**
 * 非同步操作錯誤處理 Hook
 */
export function useAsyncErrorHandler() {
  const { handleError, showSuccess } = useErrorHandler();

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: {
      successTitle?: string;
      successMessage?: string;
      context?: Record<string, any>;
      showSuccessMessage?: boolean;
    }
  ): Promise<{ success: boolean; data?: T; error?: ErrorInfo }> => {
    try {
      const result = await operation();
      
      if (options?.showSuccessMessage && options.successTitle && options.successMessage) {
        showSuccess(options.successTitle, options.successMessage);
      }
      
      return { success: true, data: result };
    } catch (error) {
      const errorInfo = handleError(error, options?.context);
      return { success: false, error: errorInfo };
    }
  }, [handleError, showSuccess]);

  return { executeWithErrorHandling };
}