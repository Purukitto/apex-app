import { create } from 'zustand';

export type NotificationType = 'warning' | 'error' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  read_at: Date | null;
  dismissed_at: Date | null;
  created_at: Date;
  bike_id?: string;
  schedule_id?: string;
  source?: string;
}

interface NotificationStore {
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (
    notification: Omit<Notification, 'id' | 'created_at' | 'read_at' | 'dismissed_at'>
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  setNotifications: (notifications) => {
    set({ notifications });
  },

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date(),
      read_at: null,
      dismissed_at: null,
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif.id === id ? { ...notif, read_at: notif.read_at ?? new Date() } : notif
      ),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((notif) => ({
        ...notif,
        read_at: notif.read_at ?? new Date(),
      })),
    }));
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif.id === id ? { ...notif, dismissed_at: new Date() } : notif
      ),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  getUnreadCount: () => {
    return get().notifications.filter(
      (notif) => !notif.read_at && !notif.dismissed_at
    ).length;
  },
}));

