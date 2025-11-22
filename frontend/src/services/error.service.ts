/**
 * Error handling and user feedback service
 * Implementation for requirements 1.4, 4.5 - Error handling with user-friendly messages
 *
 * Internationalization: This service uses i18n translation keys
 */

import i18n from '../locales/i18n';

export interface ErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  category: 'network' | 'validation' | 'storage' | 'sync' | 'unknown';
  timestamp: Date;
  context?: Record<string, any>;
}

export interface UserFeedback {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // milliseconds, 0 means persistent
  actionable?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
}

// Error code definitions
export const ERROR_CODES = {
  // Network errors
  NETWORK_UNAVAILABLE: 'NETWORK_UNAVAILABLE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  API_ERROR: 'API_ERROR',

  // Validation errors
  INVALID_VOLUME: 'INVALID_VOLUME',
  INVALID_TIMESTAMP: 'INVALID_TIMESTAMP',
  VALIDATION_FAILED: 'VALIDATION_FAILED',

  // Storage errors
  STORAGE_FULL: 'STORAGE_FULL',
  STORAGE_ERROR: 'STORAGE_ERROR',
  INDEXEDDB_ERROR: 'INDEXEDDB_ERROR',

  // Sync errors
  SYNC_FAILED: 'SYNC_FAILED',
  CONFLICT_RESOLUTION_FAILED: 'CONFLICT_RESOLUTION_FAILED',
  RETRY_EXHAUSTED: 'RETRY_EXHAUSTED',

  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  OPERATION_CANCELLED: 'OPERATION_CANCELLED'
} as const;

// Error code to i18n key mapping
const ERROR_I18N_KEYS: Record<string, { titleKey: string; messageKey: string; severity: ErrorInfo['severity'] }> = {
  [ERROR_CODES.NETWORK_UNAVAILABLE]: {
    titleKey: 'errors.networkUnavailable.title',
    messageKey: 'errors.networkUnavailable.message',
    severity: 'medium'
  },
  [ERROR_CODES.NETWORK_TIMEOUT]: {
    titleKey: 'errors.networkTimeout.title',
    messageKey: 'errors.networkTimeout.message',
    severity: 'medium'
  },
  [ERROR_CODES.SERVER_ERROR]: {
    titleKey: 'errors.serverError.title',
    messageKey: 'errors.serverError.message',
    severity: 'high'
  },
  [ERROR_CODES.API_ERROR]: {
    titleKey: 'errors.apiError.title',
    messageKey: 'errors.apiError.message',
    severity: 'medium'
  },
  [ERROR_CODES.INVALID_VOLUME]: {
    titleKey: 'errors.invalidVolume.title',
    messageKey: 'errors.invalidVolume.message',
    severity: 'low'
  },
  [ERROR_CODES.INVALID_TIMESTAMP]: {
    titleKey: 'errors.invalidTimestamp.title',
    messageKey: 'errors.invalidTimestamp.message',
    severity: 'low'
  },
  [ERROR_CODES.VALIDATION_FAILED]: {
    titleKey: 'errors.validationFailed.title',
    messageKey: 'errors.validationFailed.message',
    severity: 'low'
  },
  [ERROR_CODES.STORAGE_FULL]: {
    titleKey: 'errors.storageFull.title',
    messageKey: 'errors.storageFull.message',
    severity: 'high'
  },
  [ERROR_CODES.STORAGE_ERROR]: {
    titleKey: 'errors.storageError.title',
    messageKey: 'errors.storageError.message',
    severity: 'medium'
  },
  [ERROR_CODES.INDEXEDDB_ERROR]: {
    titleKey: 'errors.indexedDBError.title',
    messageKey: 'errors.indexedDBError.message',
    severity: 'high'
  },
  [ERROR_CODES.SYNC_FAILED]: {
    titleKey: 'errors.syncFailed.title',
    messageKey: 'errors.syncFailed.message',
    severity: 'medium'
  },
  [ERROR_CODES.CONFLICT_RESOLUTION_FAILED]: {
    titleKey: 'errors.conflictResolution.title',
    messageKey: 'errors.conflictResolution.message',
    severity: 'low'
  },
  [ERROR_CODES.RETRY_EXHAUSTED]: {
    titleKey: 'errors.retryExhausted.title',
    messageKey: 'errors.retryExhausted.message',
    severity: 'high'
  },
  [ERROR_CODES.UNKNOWN_ERROR]: {
    titleKey: 'errors.unknownError.title',
    messageKey: 'errors.unknownError.message',
    severity: 'medium'
  },
  [ERROR_CODES.OPERATION_CANCELLED]: {
    titleKey: 'errors.operationCancelled.title',
    messageKey: 'errors.operationCancelled.message',
    severity: 'low'
  }
};

// Helper function to get translated error messages
const getErrorMessages = (code: string): { title: string; message: string; severity: ErrorInfo['severity'] } => {
  const keys = ERROR_I18N_KEYS[code] || ERROR_I18N_KEYS[ERROR_CODES.UNKNOWN_ERROR];
  return {
    title: i18n.t(keys.titleKey),
    message: i18n.t(keys.messageKey),
    severity: keys.severity
  };
};

class ErrorService {
  private errorListeners: Set<(error: ErrorInfo) => void> = new Set();
  private feedbackListeners: Set<(feedback: UserFeedback) => void> = new Set();
  private errorHistory: ErrorInfo[] = [];
  private maxHistorySize = 100;

  /**
   * 處理錯誤並轉換為使用者友善的訊息
   */
  public handleError(error: any, context?: Record<string, any>): ErrorInfo {
    const errorInfo = this.parseError(error, context);
    
    // 記錄錯誤
    this.logError(errorInfo);
    
    // 通知監聽器
    this.notifyErrorListeners(errorInfo);
    
    // 生成使用者回饋
    const feedback = this.createUserFeedback(errorInfo);
    this.showUserFeedback(feedback);
    
    return errorInfo;
  }

  /**
   * 解析錯誤物件
   */
  private parseError(error: any, context?: Record<string, any>): ErrorInfo {
    let code: string = ERROR_CODES.UNKNOWN_ERROR;
    let message = 'Unknown error occurred';
    let category: ErrorInfo['category'] = 'unknown';
    let retryable = false;

    if (error instanceof Error) {
      message = error.message;
      
      // 根據錯誤訊息或屬性判斷錯誤類型
      if ('code' in error && typeof error.code === 'string') {
        code = error.code;
      } else if (error.name === 'NetworkError' || message.includes('network')) {
        code = ERROR_CODES.NETWORK_UNAVAILABLE;
        category = 'network';
        retryable = true;
      } else if (error.name === 'TimeoutError' || message.includes('timeout')) {
        code = ERROR_CODES.NETWORK_TIMEOUT;
        category = 'network';
        retryable = true;
      } else if (message.includes('validation') || message.includes('invalid')) {
        code = ERROR_CODES.VALIDATION_FAILED;
        category = 'validation';
        retryable = false;
      } else if (message.includes('storage') || message.includes('quota')) {
        code = ERROR_CODES.STORAGE_ERROR;
        category = 'storage';
        retryable = false;
      } else if (message.includes('sync')) {
        code = ERROR_CODES.SYNC_FAILED;
        category = 'sync';
        retryable = true;
      }
    } else if (typeof error === 'string') {
      message = error;
      code = ERROR_CODES.UNKNOWN_ERROR;
    }

    // Check if it's a known error code
    if (Object.values(ERROR_CODES).includes(code as any)) {
      const errorConfig = getErrorMessages(code);
      return {
        code,
        message,
        userMessage: errorConfig.message,
        severity: errorConfig.severity,
        retryable,
        category,
        timestamp: new Date(),
        context
      };
    }

    const defaultConfig = getErrorMessages(ERROR_CODES.UNKNOWN_ERROR);
    return {
      code,
      message,
      userMessage: defaultConfig.message,
      severity: 'medium',
      retryable,
      category,
      timestamp: new Date(),
      context
    };
  }

  /**
   * 記錄錯誤到歷史記錄
   */
  private logError(errorInfo: ErrorInfo): void {
    console.error(`[${errorInfo.code}] ${errorInfo.message}`, errorInfo.context);
    
    this.errorHistory.unshift(errorInfo);
    
    // 限制歷史記錄大小
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * 通知錯誤監聽器
   */
  private notifyErrorListeners(errorInfo: ErrorInfo): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (error) {
        console.error('Error in error listener:', error);
      }
    });
  }

  /**
   * Create user feedback message
   */
  private createUserFeedback(errorInfo: ErrorInfo): UserFeedback {
    const errorConfig = getErrorMessages(errorInfo.code);

    let type: UserFeedback['type'] = 'error';
    let duration = 5000; // 5 seconds default

    switch (errorInfo.severity) {
      case 'low':
        type = 'warning';
        duration = 3000;
        break;
      case 'medium':
        type = 'error';
        duration = 5000;
        break;
      case 'high':
        type = 'error';
        duration = 8000;
        break;
      case 'critical':
        type = 'error';
        duration = 0; // Persistent
        break;
    }

    const feedback: UserFeedback = {
      type,
      title: errorConfig.title,
      message: errorInfo.userMessage,
      duration,
      actionable: errorInfo.retryable
    };

    // Add retry button for retryable errors
    if (errorInfo.retryable) {
      feedback.actions = [
        {
          label: i18n.t('common.retry'),
          action: () => {
            // Retry logic should be implemented by the caller
            console.log('Retry action triggered for error:', errorInfo.code);
          },
          primary: true
        }
      ];
    }

    return feedback;
  }

  /**
   * 顯示使用者回饋
   */
  private showUserFeedback(feedback: UserFeedback): void {
    this.feedbackListeners.forEach(listener => {
      try {
        listener(feedback);
      } catch (error) {
        console.error('Error in feedback listener:', error);
      }
    });
  }

  /**
   * 顯示成功訊息
   */
  public showSuccess(title: string, message: string, duration: number = 3000): void {
    const feedback: UserFeedback = {
      type: 'success',
      title,
      message,
      duration
    };
    
    this.showUserFeedback(feedback);
  }

  /**
   * 顯示資訊訊息
   */
  public showInfo(title: string, message: string, duration: number = 4000): void {
    const feedback: UserFeedback = {
      type: 'info',
      title,
      message,
      duration
    };
    
    this.showUserFeedback(feedback);
  }

  /**
   * 顯示警告訊息
   */
  public showWarning(title: string, message: string, duration: number = 5000): void {
    const feedback: UserFeedback = {
      type: 'warning',
      title,
      message,
      duration
    };
    
    this.showUserFeedback(feedback);
  }

  /**
   * 註冊錯誤監聽器
   */
  public onError(listener: (error: ErrorInfo) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /**
   * 註冊回饋監聽器
   */
  public onFeedback(listener: (feedback: UserFeedback) => void): () => void {
    this.feedbackListeners.add(listener);
    return () => this.feedbackListeners.delete(listener);
  }

  /**
   * 取得錯誤歷史記錄
   */
  public getErrorHistory(): ErrorInfo[] {
    return [...this.errorHistory];
  }

  /**
   * 清除錯誤歷史記錄
   */
  public clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * 驗證飲水量輸入
   */
  public validateVolume(volume: number): { valid: boolean; error?: ErrorInfo } {
    if (typeof volume !== 'number' || isNaN(volume)) {
      return {
        valid: false,
        error: this.handleError(new Error('Volume must be a number'), { volume })
      };
    }

    if (volume < 1 || volume > 5000) {
      return {
        valid: false,
        error: this.handleError(new Error('Volume must be between 1 and 5000 ml'), { volume })
      };
    }

    return { valid: true };
  }

  /**
   * 驗證時間戳輸入
   */
  public validateTimestamp(timestamp: Date): { valid: boolean; error?: ErrorInfo } {
    if (!(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
      return {
        valid: false,
        error: this.handleError(new Error('Invalid timestamp'), { timestamp })
      };
    }

    const now = new Date();
    if (timestamp > now) {
      return {
        valid: false,
        error: this.handleError(new Error('Timestamp cannot be in the future'), { timestamp, now })
      };
    }

    // 檢查時間是否過於久遠（超過一年）
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    if (timestamp < oneYearAgo) {
      return {
        valid: false,
        error: this.handleError(new Error('Timestamp cannot be more than one year ago'), { timestamp, oneYearAgo })
      };
    }

    return { valid: true };
  }
}

export const errorService = new ErrorService();