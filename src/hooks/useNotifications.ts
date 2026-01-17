import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { apexToast } from '../lib/toast';
import { logger } from '../lib/logger';
import { useNotificationStore, type Notification } from '../stores/useNotificationStore';
import type { NotificationRow } from '../types/database';

const mapNotificationRow = (row: NotificationRow): Notification => ({
  id: row.id,
  type: row.type,
  title: row.title ?? undefined,
  message: row.message,
  read_at: row.read_at ? new Date(row.read_at) : null,
  dismissed_at: row.dismissed_at ? new Date(row.dismissed_at) : null,
  created_at: new Date(row.created_at),
  bike_id: row.bike_id ?? undefined,
  schedule_id: row.schedule_id ?? undefined,
  source: row.source ?? undefined,
});

export function useNotifications() {
  const queryClient = useQueryClient();
  const { setNotifications } = useNotificationStore();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (isMounted) {
          setUserId(data.user?.id ?? null);
        }
      })
      .catch((error) => {
        logger.error('Failed to read auth user for notifications:', error);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id ?? null);
      }
    );
    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const notificationsQuery = useQuery({
    queryKey: ['notifications', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data as NotificationRow[]).map(mapNotificationRow);
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (notificationsQuery.data) {
      setNotifications(notificationsQuery.data);
    }
  }, [notificationsQuery.data, setNotifications]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .is('read_at', null);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
    onError: (error) => {
      logger.error('Failed to mark notification read:', error);
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', id)
        .is('dismissed_at', null);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
    onError: (error) => {
      logger.error('Failed to dismiss notification:', error);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null)
        .is('dismissed_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
    onError: (error) => {
      logger.error('Failed to mark all notifications read:', error);
    },
  });

  const dismissAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('dismissed_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
    onError: (error) => {
      logger.error('Failed to dismiss all notifications:', error);
    },
  });

  const notifications = useMemo(
    () => notificationsQuery.data ?? [],
    [notificationsQuery.data]
  );
  const unreadCount = useMemo(
    () => notifications.filter((notif) => !notif.read_at).length,
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    markAsRead: async (id: string) => {
      await apexToast.promise(
        markAsReadMutation.mutateAsync(id),
        {
          loading: 'Marking read...',
          success: 'Marked Read',
          error: 'Failed to mark as read',
        },
        {
          errorAction: {
            label: 'Retry',
            onClick: () => markAsReadMutation.mutate(id),
          },
        }
      );
    },
    dismissNotification: async (id: string) => {
      await apexToast.promise(
        dismissMutation.mutateAsync(id),
        {
          loading: 'Dismissing...',
          success: 'Dismissed',
          error: 'Failed to dismiss',
        },
        {
          errorAction: {
            label: 'Retry',
            onClick: () => dismissMutation.mutate(id),
          },
        }
      );
    },
    markAllAsRead: async () => {
      await apexToast.promise(
        markAllAsReadMutation.mutateAsync(),
        {
          loading: 'Marking all read...',
          success: 'All Read',
          error: 'Failed to mark all read',
        },
        {
          errorAction: {
            label: 'Retry',
            onClick: () => markAllAsReadMutation.mutate(),
          },
        }
      );
    },
    dismissAll: async () => {
      await apexToast.promise(
        dismissAllMutation.mutateAsync(),
        {
          loading: 'Dismissing all...',
          success: 'All Dismissed',
          error: 'Failed to dismiss all',
        },
        {
          errorAction: {
            label: 'Retry',
            onClick: () => dismissAllMutation.mutate(),
          },
        }
      );
    },
  };
}
