'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '@/lib/api/notifications';
import { queryKeys } from '@/lib/query-keys';
import { useUIStore } from '@/store/ui.store';

/**
 * Fetches the notification unread count and syncs it into the UIStore.
 * Call this once at the top level (e.g., inside SocketInitializer or AppShell).
 */
export function useNotifications() {
  const setUnreadNotifications = useUIStore((s) => s.setUnreadNotifications);

  const { data: unreadCount } = useQuery({
    queryKey: queryKeys.unreadCount(),
    queryFn: getUnreadCount,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000, // re-poll every 5 min
  });

  useEffect(() => {
    if (typeof unreadCount === 'number') {
      setUnreadNotifications(unreadCount);
    }
  }, [unreadCount, setUnreadNotifications]);
}
