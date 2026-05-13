import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import {
  getNotifications,
  getUnreadCount,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
  type DBNotification,
} from '@/services/notificationService';

interface NotificationContextType {
  notifications: DBNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: true,
  refresh: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [notifs, count] = await Promise.all([
        getNotifications(user.id, 100),
        getUnreadCount(user.id),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (e) {
      console.warn('Erro ao carregar notificações:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load + real-time subscription
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    refresh();

    // Subscribe to real-time inserts on the notificacoes table
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
        },
        (payload) => {
          const newNotif = payload.new as DBNotification;
          // Only add if it's relevant to this user (personal or broadcast)
          if (newNotif.user_id === null || newNotif.user_id === user.id) {
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notificacoes',
        },
        () => {
          // Refresh on updates (mark as read etc.)
          refresh();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, refresh]);

  const markAsRead = useCallback(async (id: string) => {
    await markAsReadService(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await markAllAsReadService(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
    setUnreadCount(0);
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
