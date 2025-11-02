/**
 * 通知 Toast 元件
 * 實作需求 1.4, 4.5 - 使用者友善的錯誤訊息與操作成功的視覺確認
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserFeedback } from '../services/error.service';

interface NotificationToastProps {
  notification: UserFeedback;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // 等待動畫完成
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration, onClose]);

  const getIconAndColors = () => {
    switch (notification.type) {
      case 'success':
        return {
          icon: '✓',
          bgColor: 'bg-green-500',
          textColor: 'text-white',
          borderColor: 'border-green-600'
        };
      case 'error':
        return {
          icon: '✕',
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          borderColor: 'border-red-600'
        };
      case 'warning':
        return {
          icon: '⚠',
          bgColor: 'bg-yellow-500',
          textColor: 'text-white',
          borderColor: 'border-yellow-600'
        };
      case 'info':
        return {
          icon: 'ℹ',
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          borderColor: 'border-blue-600'
        };
      default:
        return {
          icon: 'ℹ',
          bgColor: 'bg-gray-500',
          textColor: 'text-white',
          borderColor: 'border-gray-600'
        };
    }
  };

  const { icon, bgColor, textColor, borderColor } = getIconAndColors();

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`
            fixed top-4 right-4 z-50 max-w-sm w-full
            ${bgColor} ${textColor} ${borderColor}
            border-l-4 rounded-lg shadow-lg
            transform transition-all duration-300
          `}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-xl font-bold">{icon}</span>
              </div>
              
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium">{notification.title}</h3>
                <p className="mt-1 text-sm opacity-90">{notification.message}</p>
                
                {notification.actions && notification.actions.length > 0 && (
                  <div className="mt-3 flex space-x-2">
                    {notification.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          action.action();
                          if (!action.primary) {
                            handleClose();
                          }
                        }}
                        className={`
                          px-3 py-1 text-xs font-medium rounded
                          transition-colors duration-200
                          ${action.primary
                            ? 'bg-white bg-opacity-20 hover:bg-opacity-30'
                            : 'bg-white bg-opacity-10 hover:bg-opacity-20'
                          }
                        `}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={handleClose}
                  className="
                    inline-flex text-white hover:text-gray-200
                    focus:outline-none focus:text-gray-200
                    transition-colors duration-200
                  "
                >
                  <span className="sr-only">關閉</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* 進度條（如果有持續時間） */}
          {notification.duration && notification.duration > 0 && (
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: notification.duration / 1000, ease: 'linear' }}
              className="h-1 bg-white bg-opacity-30"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationToast;