import { create } from 'zustand';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string, duration?: number) => void;
  removeNotification: (id: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  addNotification: (type, message, duration = 3000) => {
    const id = Date.now();
    set((state) => ({
      notifications: [...state.notifications, { id, type, message, duration }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  success: (message) => get().addNotification('success', message),
  error: (message) => get().addNotification('error', message, 5000),
  warning: (message) => get().addNotification('warning', message),
  info: (message) => get().addNotification('info', message),
}));
