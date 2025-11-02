/**
 * 錯誤處理與使用者回饋服務
 * 實作需求 1.4, 4.5 - 錯誤處理與使用者友善的錯誤訊息
 */

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

// 錯誤代碼定義
export const ERROR_CODES = {
  // 網路錯誤
  NETWORK_UNAVAILABLE: 'NETWORK_UNAVAILABLE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  API_ERROR: 'API_ERROR',
  
  // 驗證錯誤
  INVALID_VOLUME: 'INVALID_VOLUME',
  INVALID_TIMESTAMP: 'INVALID_TIMESTAMP',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  
  // 儲存錯誤
  STORAGE_FULL: 'STORAGE_FULL',
  STORAGE_ERROR: 'STORAGE_ERROR',
  INDEXEDDB_ERROR: 'INDEXEDDB_ERROR',
  
  // 同步錯誤
  SYNC_FAILED: 'SYNC_FAILED',
  CONFLICT_RESOLUTION_FAILED: 'CONFLICT_RESOLUTION_FAILED',
  RETRY_EXHAUSTED: 'RETRY_EXHAUSTED',
  
  // 一般錯誤
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  OPERATION_CANCELLED: 'OPERATION_CANCELLED'
} as const;

// 使用者友善的錯誤訊息映射
const ERROR_MESSAGES: Record<string, { title: string; message: string; severity: ErrorInfo['severity'] }> = {
  [ERROR_CODES.NETWORK_UNAVAILABLE]: {
    title: '網路連線問題',
    message: '目前無法連接到網路，您的記錄將暫時儲存在本地，待網路恢復後自動同步。',
    severity: 'medium'
  },
  [ERROR_CODES.NETWORK_TIMEOUT]: {
    title: '連線逾時',
    message: '網路回應時間過長，請檢查您的網路連線狀況。',
    severity: 'medium'
  },
  [ERROR_CODES.SERVER_ERROR]: {
    title: '伺服器錯誤',
    message: '伺服器暫時無法處理您的請求，請稍後再試。',
    severity: 'high'
  },
  [ERROR_CODES.API_ERROR]: {
    title: '服務錯誤',
    message: '服務暫時不可用，您的資料已安全儲存在本地。',
    severity: 'medium'
  },
  [ERROR_CODES.INVALID_VOLUME]: {
    title: '輸入錯誤',
    message: '請輸入有效的飲水量（1-5000ml）。',
    severity: 'low'
  },
  [ERROR_CODES.INVALID_TIMESTAMP]: {
    title: '時間錯誤',
    message: '請選擇有效的時間。',
    severity: 'low'
  },
  [ERROR_CODES.VALIDATION_FAILED]: {
    title: '資料驗證失敗',
    message: '輸入的資料格式不正確，請檢查後重新輸入。',
    severity: 'low'
  },
  [ERROR_CODES.STORAGE_FULL]: {
    title: '儲存空間不足',
    message: '本地儲存空間已滿，請清理一些舊資料或聯繫技術支援。',
    severity: 'high'
  },
  [ERROR_CODES.STORAGE_ERROR]: {
    title: '儲存錯誤',
    message: '無法儲存資料到本地，請重新嘗試。',
    severity: 'medium'
  },
  [ERROR_CODES.INDEXEDDB_ERROR]: {
    title: '本地資料庫錯誤',
    message: '本地資料庫發生問題，可能需要重新整理頁面。',
    severity: 'high'
  },
  [ERROR_CODES.SYNC_FAILED]: {
    title: '同步失敗',
    message: '無法同步您的資料，將在網路恢復後自動重試。',
    severity: 'medium'
  },
  [ERROR_CODES.CONFLICT_RESOLUTION_FAILED]: {
    title: '資料衝突',
    message: '發現資料衝突，已自動選擇最新的記錄。',
    severity: 'low'
  },
  [ERROR_CODES.RETRY_EXHAUSTED]: {
    title: '重試次數已達上限',
    message: '操作重試次數已達上限，請檢查網路連線後手動重試。',
    severity: 'high'
  },
  [ERROR_CODES.UNKNOWN_ERROR]: {
    title: '未知錯誤',
    message: '發生未預期的錯誤，請重新嘗試或聯繫技術支援。',
    severity: 'medium'
  },
  [ERROR_CODES.OPERATION_CANCELLED]: {
    title: '操作已取消',
    message: '操作已被使用者取消。',
    severity: 'low'
  }
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

    // 檢查是否為已知的錯誤代碼
    if (Object.values(ERROR_CODES).includes(code as any)) {
      const errorConfig = ERROR_MESSAGES[code];
      if (errorConfig) {
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
    }

    return {
      code,
      message,
      userMessage: ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR].message,
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
   * 創建使用者回饋訊息
   */
  private createUserFeedback(errorInfo: ErrorInfo): UserFeedback {
    const errorConfig = ERROR_MESSAGES[errorInfo.code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
    
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

    // 為可重試的錯誤添加重試按鈕
    if (errorInfo.retryable) {
      feedback.actions = [
        {
          label: '重試',
          action: () => {
            // 這裡需要實作重試邏輯，通常由調用方提供
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