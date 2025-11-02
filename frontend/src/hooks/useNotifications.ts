import { useState, useEffect } from 'react';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const showNotification = (options: NotificationOptions): Notification | null => {
    if (!isSupported || permission !== 'granted') {
      return null;
    }

    return new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      tag: options.tag
    });
  };

  const scheduleReminder = (delayMs: number, options: NotificationOptions): number => {
    return window.setTimeout(() => {
      showNotification(options);
    }, delayMs);
  };

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    scheduleReminder
  };
};