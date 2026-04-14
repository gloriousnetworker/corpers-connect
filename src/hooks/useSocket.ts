'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSocket, getCallsSocket, disconnectSocket } from '@/lib/socket';
import { getAccessToken } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth.store';
import { useMessagesStore } from '@/store/messages.store';
import { useUIStore } from '@/store/ui.store';
import { queryKeys } from '@/lib/query-keys';
import { normalizeMessage, getConversation } from '@/lib/api/conversations';
import type { Message, Notification } from '@/types/models';
import type { PaginatedData } from '@/types/api';

export function useSocket() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const router = useRouter();
  // Use targeted selectors so this hook only triggers when the specific actions change
  // (Zustand actions are stable, so this effectively never re-runs the effect from here)
  const setTyping = useMessagesStore((s) => s.setTyping);
  const setUserOnline = useMessagesStore((s) => s.setUserOnline);
  const setUserOffline = useMessagesStore((s) => s.setUserOffline);
  const setPendingConversation = useMessagesStore((s) => s.setPendingConversation);
  const incrementUnread = useUIStore((s) => s.incrementUnread);
  const setActiveSection = useUIStore((s) => s.setActiveSection);
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!user || !token) return;

    const socket = getSocket(token);
    // Eagerly init the calls socket so it's ready before the first incoming call
    getCallsSocket(token);

    // ── Incoming new message ──────────────────────────────────────────────────
    socket.on('message:new', (rawMessage: Record<string, unknown>) => {
      const msg = normalizeMessage(rawMessage as unknown as Parameters<typeof normalizeMessage>[0]);
      const convId = msg.conversationId;

      queryClient.setQueryData<InfiniteData<PaginatedData<Message>>>(
        queryKeys.messages(convId),
        (old) => {
          if (!old) return old;
          const pages = [...old.pages];
          const first = pages[0];
          // Deduplicate by ID
          if (first.items.some((m) => m.id === msg.id)) return old;
          pages[0] = { ...first, items: [msg, ...first.items] };
          return { ...old, pages };
        }
      );

      // Refresh conversation list to update last message / unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
    });

    // ── Notification events ────────────────────────────────────────────────────
    socket.on('notification:new', (payload?: Partial<Notification> & { actorName?: string }) => {
      incrementUnread();
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount() });

      const actorName = payload?.actor
        ? `${payload.actor.firstName} ${payload.actor.lastName}`
        : (payload?.actorName ?? 'Corpers Connect');
      const description = payload?.content ?? 'You have a new notification';

      const handleView = () => {
        const { type, entityType, entityId, actorId } = payload ?? {};
        if (type === 'DM_RECEIVED' && entityId) {
          getConversation(entityId)
            .then((conv) => {
              setPendingConversation(conv);
              setActiveSection('messages');
            })
            .catch(() => setActiveSection('messages'));
        } else if (entityType === 'Post' && entityId) {
          router.push(`/post/${entityId}`);
        } else if (actorId) {
          setViewingUser(actorId);
        } else {
          setActiveSection('notifications');
        }
      };

      toast(actorName, {
        description,
        action: { label: 'View', onClick: handleView },
        duration: 5000,
      });
    });

    // ── Message edited ────────────────────────────────────────────────────────
    socket.on('message:edited', (rawMessage: Record<string, unknown>) => {
      const msg = normalizeMessage(rawMessage as unknown as Parameters<typeof normalizeMessage>[0]);
      queryClient.setQueryData<InfiniteData<PaginatedData<Message>>>(
        queryKeys.messages(msg.conversationId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              items: p.items.map((m) => (m.id === msg.id ? msg : m)),
            })),
          };
        }
      );
    });

    // ── Message deleted ───────────────────────────────────────────────────────
    socket.on(
      'message:deleted',
      ({ messageId, deleteFor, conversationId, lockedFor }: {
        messageId: string;
        deleteFor: 'me' | 'all';
        conversationId?: string;
        lockedFor?: string[];
      }) => {
        const currentUserId = user?.id;
        // We don't always know conversationId from the event — iterate all cached queries
        const queries = queryClient.getQueriesData<InfiniteData<PaginatedData<Message>>>({ queryKey: ['messages'] });
        for (const [key, data] of queries) {
          if (!data) continue;
          queryClient.setQueryData<InfiniteData<PaginatedData<Message>>>(key, {
            ...data,
            pages: data.pages.map((p) => ({
              ...p,
              items: deleteFor === 'all'
                ? p.items.map((m) => {
                    if (m.id !== messageId) return m;
                    // If current user locked this message in, keep content visible
                    const userLockedIt = currentUserId && (lockedFor ?? []).includes(currentUserId);
                    return {
                      ...m,
                      isDeleted: true,
                      lockedFor: lockedFor ?? m.lockedFor,
                      content: userLockedIt ? m.content : null,
                      mediaUrl: userLockedIt ? m.mediaUrl : null,
                    };
                  })
                : p.items.filter((m) => m.id !== messageId),
            })),
          });
        }
        if (conversationId) queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
      }
    );

    // ── Typing indicators ─────────────────────────────────────────────────────
    socket.on('typing:start', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      if (userId !== user.id) setTyping(conversationId, userId, true);
    });

    socket.on('typing:stop', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      setTyping(conversationId, userId, false);
    });

    // ── Online presence ───────────────────────────────────────────────────────
    socket.on('user:online', ({ userId }: { userId: string }) => setUserOnline(userId));
    socket.on('user:offline', ({ userId }: { userId: string }) => setUserOffline(userId));

    // ── Connection status ─────────────────────────────────────────────────────
    const reconnectToastId = 'socket-reconnecting';

    socket.on('disconnect', () => {
      toast.loading('Connection lost. Reconnecting…', {
        id: reconnectToastId,
        duration: Infinity,
      });
    });

    socket.on('reconnect_attempt', () => {
      toast.loading('Reconnecting…', {
        id: reconnectToastId,
        duration: Infinity,
      });
    });

    socket.on('connect', () => {
      toast.dismiss(reconnectToastId);
    });

    // ── Keep-alive ping (60s) ─────────────────────────────────────────────────
    pingRef.current = setInterval(() => {
      socket.emit('ping:online');
    }, 55_000);

    return () => {
      socket.off('message:new');
      socket.off('message:edited');
      socket.off('message:deleted');
      socket.off('notification:new');
      socket.off('typing:start');
      socket.off('typing:stop');
      socket.off('user:online');
      socket.off('user:offline');
      socket.off('disconnect');
      socket.off('reconnect_attempt');
      socket.off('connect');
      if (pingRef.current) clearInterval(pingRef.current);
      toast.dismiss(reconnectToastId);
    };
  }, [user, queryClient, router, setTyping, setUserOnline, setUserOffline, setPendingConversation, incrementUnread, setActiveSection, setViewingUser]);

  // Disconnect on logout
  useEffect(() => {
    if (!user) disconnectSocket();
  }, [user]);

  return null;
}
