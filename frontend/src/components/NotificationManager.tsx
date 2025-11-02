/**
 * 通知管理器元件
 * 管理所有通知的顯示與生命週期
 */

import React, { useEffect, useState } from 'react';
import { errorService, UserFeedback } from '../services/error.service';
import NotificationToast from './NotificationToast';

interface NotificationWithId extends UserFeedback {
  id: string;
}

const NotificationManager: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationWithId[]>([]);

  useEffect(() => {
    // 監聽錯誤服務的回饋事件
    const unsubscribe = errorService.onFeedback((feedback: UserFeedback) => {
      const notificationWithId: NotificationWithId = {
        ...feedback,
        id: crypto.randomUUID()
      };

      setNotifications(prev => [...prev, notificationWithId]);
    });

    return unsubscribe;
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default NotificationManager;