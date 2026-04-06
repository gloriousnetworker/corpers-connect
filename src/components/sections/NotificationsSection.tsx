'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getNotifications, markAllRead, markAsRead } from '@/lib/api/notifications';
import { getConversation } from '@/lib/api/conversations';
import { queryKeys } from '@/lib/query-keys';
import { useUIStore } from '@/store/ui.store';
import { useMessagesStore } from '@/store/messages.store';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationItem from '@/components/profile/NotificationItem';
import type { Notification } from '@/types/models';

export default function NotificationsSection() {
  const setUnreadNotifications = useUIStore((s) => s.setUnreadNotifications);
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const setActiveSection = useUIStore((s) => s.setActiveSection);
  const setPendingConversation = useMessagesStore((s) => s.setPendingConversation);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Sync unread count to UIStore
  useNotifications();

  const notificationsQuery = useInfiniteQuery({
    queryKey: queryKeys.notifications(),
    queryFn: ({ pageParam }) => getNotifications(pageParam as string | undefined),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
  });

  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      setUnreadNotifications(0);
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount() });
    },
    onError: () => toast.error('Failed to mark as read'),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => markAsRead([id]),
    onSuccess: (_data, id) => {
      // Optimistically flip isRead in the cached list
      queryClient.setQueryData(
        queryKeys.notifications(),
        (old: { pages: { items: Notification[] }[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((n) =>
                n.id === id ? { ...n, isRead: true } : n
              ),
            })),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount() });
    },
  });

  // Clear badge when user opens this section
  useEffect(() => {
    setUnreadNotifications(0);
  }, [setUnreadNotifications]);

  const notifications: Notification[] = notificationsQuery.data?.pages.flatMap((p) => p.items) ?? [];

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markOneMutation.mutate(notification.id);
    }

    const { type, entityType, entityId, actorId } = notification;

    if (type === 'DM_RECEIVED' && entityId) {
      getConversation(entityId)
        .then((conv) => {
          setPendingConversation(conv);
          setActiveSection('messages');
        })
        .catch(() => {
          toast.error('Could not open conversation');
        });
      return;
    }

    if (entityType === 'Post' && entityId) {
      useUIStore.setState({
        viewingPostId: entityId,
        previousSection: 'notifications',
        activeSection: 'postDetail',
      });
      return;
    }

    if (type === 'FOLLOW' && actorId) {
      setViewingUser(actorId, 'notifications');
      return;
    }

    // Fall back to actor's profile
    if (actorId) {
      setViewingUser(actorId, 'notifications');
    }
  };

  return (
    <div className="max-w-[680px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface sticky top-[var(--top-bar-height,56px)] z-20">
        <h2 className="text-base font-bold text-foreground">Notifications</h2>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-70 transition-opacity disabled:opacity-40"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bg-surface">
        {notificationsQuery.isLoading ? (
          <NotificationsSkeleton />
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold text-foreground">No notifications yet</p>
            <p className="text-sm text-foreground-muted mt-1 max-w-xs">
              When someone likes or comments on your posts, you&apos;ll see it here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onPress={() => handleNotificationPress(n)}
              />
            ))}

            {notificationsQuery.hasNextPage && (
              <div className="p-4 text-center">
                <button
                  onClick={() => notificationsQuery.fetchNextPage()}
                  disabled={notificationsQuery.isFetchingNextPage}
                  className="text-sm text-primary font-semibold disabled:opacity-50"
                >
                  {notificationsQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="divide-y divide-border/50">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3.5">
          <div className="w-10 h-10 rounded-full bg-surface-alt animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-3 bg-surface-alt rounded animate-pulse w-3/4" />
            <div className="h-2.5 bg-surface-alt rounded animate-pulse w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
