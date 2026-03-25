'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { getAccessToken } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth.store';
import { useMessagesStore } from '@/store/messages.store';
import { useUIStore } from '@/store/ui.store';
import { queryKeys } from '@/lib/query-keys';
import { normalizeMessage } from '@/lib/api/conversations';
import type { Message } from '@/types/models';
import type { PaginatedData } from '@/types/api';

export function useSocket() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  // Use targeted selectors so this hook only triggers when the specific actions change
  // (Zustand actions are stable, so this effectively never re-runs the effect from here)
  const setTyping = useMessagesStore((s) => s.setTyping);
  const setUserOnline = useMessagesStore((s) => s.setUserOnline);
  const setUserOffline = useMessagesStore((s) => s.setUserOffline);
  const incrementUnread = useUIStore((s) => s.incrementUnread);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!user || !token) return;

    const socket = getSocket(token);

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
    socket.on('notification:new', () => {
      incrementUnread();
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount() });
    });

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

    // ── Keep-alive ping (60s) ─────────────────────────────────────────────────
    pingRef.current = setInterval(() => {
      socket.emit('ping:online');
    }, 55_000);

    return () => {
      socket.off('message:new');
      socket.off('notification:new');
      socket.off('typing:start');
      socket.off('typing:stop');
      socket.off('user:online');
      socket.off('user:offline');
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, [user, queryClient, setTyping, setUserOnline, setUserOffline, incrementUnread]);

  // Disconnect on logout
  useEffect(() => {
    if (!user) disconnectSocket();
  }, [user]);

  return null;
}
