import { useState, useEffect, useCallback } from 'react';
import type { Notification } from '@/types';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount } from '@/lib/db';

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = useCallback(() => {
    if (userId) {
      const allNotifications = getNotifications(userId);
      setNotifications(allNotifications);
      setUnreadCount(getUnreadCount(userId));
    }
  }, [userId]);

  useEffect(() => {
    refreshNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markAsRead = useCallback((notificationId: string) => {
    markNotificationAsRead(notificationId);
    refreshNotifications();
  }, [refreshNotifications]);

  const markAllAsRead = useCallback(() => {
    if (userId) {
      markAllNotificationsAsRead(userId);
      refreshNotifications();
    }
  }, [userId, refreshNotifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };
}
