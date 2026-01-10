import { createContext, useContext } from 'react';

interface NotificationContextType {
  openNotifications: () => void;
  unreadCount: number;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotificationHandler() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationHandler must be used within MainLayout');
  }
  return context;
}
