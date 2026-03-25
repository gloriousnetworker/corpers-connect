'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ArrowLeft, Users, MoreVertical, Phone } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markRead,
} from '@/lib/api/conversations';
import { normalizeMessage } from '@/lib/api/conversations';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useMessagesStore } from '@/store/messages.store';
import { getExistingSocket } from '@/lib/socket';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { ConversationType, MessageType } from '@/types/enums';
import type { Conversation, Message } from '@/types/models';
import type { PaginatedData } from '@/types/api';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

interface ChatViewProps {
  conversation: Conversation;
  onBack: () => void;
}

function getDmPartner(conv: Conversation, currentUserId: string) {
  return conv.participants.find((p) => p.userId !== currentUserId)?.user ?? null;
}

let _tempIdCounter = 0;
function newTempId() { return `temp-${++_tempIdCounter}`; }

// Stable empty array so the typingUsers selector doesn't return a new reference
// on every store tick when there are no typing users (which would cause infinite re-renders).
const EMPTY_TYPING: string[] = [];

export default function ChatView({ conversation, onBack }: ChatViewProps) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const typingUsers = useMessagesStore((s) => s.typingUsers[conversation.id] ?? EMPTY_TYPING);
  const onlineUsers = useMessagesStore((s) => s.onlineUsers);
  const setTyping = useMessagesStore((s) => s.setTyping);

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef(0);
  const isAtBottomRef = useRef(true);
  const typingSocketRef = useRef(false);

  const isGroup = conversation.type === ConversationType.GROUP;
  const dmPartner = getDmPartner(conversation, user?.id ?? '');
  const headerName = isGroup ? (conversation.name ?? 'Group') : (dmPartner ? `${dmPartner.firstName} ${dmPartner.lastName}` : 'Unknown');
  const headerAvatar = isGroup ? conversation.picture : dmPartner?.profilePicture;
  const headerInitials = isGroup
    ? (conversation.name ?? 'G').slice(0, 2).toUpperCase()
    : getInitials(dmPartner?.firstName ?? '', dmPartner?.lastName ?? '');
  const isPartnerOnline = !isGroup && !!dmPartner && onlineUsers.has(dmPartner.id);

  // ── Message history ────────────────────────────────────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: queryKeys.messages(conversation.id),
    queryFn: ({ pageParam }) =>
      getMessages(conversation.id, { cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 60_000,
  });

  // Flatten + reverse for display (oldest at top, newest at bottom)
  const allMessages: Message[] = [...(data?.pages ?? [])]
    .reverse()
    .flatMap((page) => [...page.items].reverse());

  // ── Scroll to bottom on initial load / new messages ─────────────────────────
  useEffect(() => {
    if (!isLoading && bottomRef.current && isAtBottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [isLoading, allMessages.length]);

  // ── Preserve scroll position when loading older messages ────────────────────
  useEffect(() => {
    const el = listRef.current;
    if (!el || !isFetchingNextPage) return;
    prevScrollHeight.current = el.scrollHeight;
  }, [isFetchingNextPage]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || isFetchingNextPage) return;
    if (prevScrollHeight.current > 0) {
      el.scrollTop = el.scrollHeight - prevScrollHeight.current;
      prevScrollHeight.current = 0;
    }
  });

  // ── Infinite scroll (scroll to top = load older) ────────────────────────────
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;
    if (el.scrollTop < 80 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Mark messages as read ───────────────────────────────────────────────────
  useEffect(() => {
    const unread = allMessages
      .filter((m) => m.senderId !== user?.id && !(m.readBy ?? []).includes(user?.id ?? ''))
      .map((m) => m.id);
    if (unread.length > 0) {
      markRead(conversation.id, unread).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMessages.length, conversation.id, user?.id]);

  // ── Join socket room ────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getExistingSocket();
    if (socket) socket.emit('conversation:join', conversation.id);
    return () => {
      const s = getExistingSocket();
      if (s) s.emit('conversation:leave', conversation.id);
    };
  }, [conversation.id]);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (vars: { content: string; replyToId?: string }) =>
      sendMessage(conversation.id, { content: vars.content, replyToId: vars.replyToId }),
    onMutate: async ({ content, replyToId }) => {
      // Optimistic update
      const tempId = newTempId();
      const optimistic: Message = {
        id: tempId,
        conversationId: conversation.id,
        senderId: user!.id,
        sender: user!,
        content,
        type: MessageType.TEXT,
        isEdited: false,
        isDeleted: false,
        replyToId: replyToId ?? null,
        replyTo: replyToId ? (allMessages.find((m) => m.id === replyToId) ?? null) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: true,
      };
      queryClient.setQueryData<InfiniteData<PaginatedData<Message>>>(
        queryKeys.messages(conversation.id),
        (old) => {
          if (!old) return old;
          const pages = [...old.pages];
          pages[0] = { ...pages[0], items: [optimistic, ...pages[0].items] };
          return { ...old, pages };
        }
      );
      isAtBottomRef.current = true;
      return { tempId };
    },
    onSuccess: (realMsg, _vars, context) => {
      // Replace optimistic with real message
      queryClient.setQueryData<InfiniteData<PaginatedData<Message>>>(
        queryKeys.messages(conversation.id),
        (old) => {
          if (!old) return old;
          const pages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((m) =>
              m.id === context?.tempId ? realMsg : m
            ),
          }));
          return { ...old, pages };
        }
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
    },
    onError: (_err, _vars, context) => {
      // Mark as failed
      queryClient.setQueryData<InfiniteData<PaginatedData<Message>>>(
        queryKeys.messages(conversation.id),
        (old) => {
          if (!old) return old;
          const pages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((m) =>
              m.id === context?.tempId ? { ...m, _pending: false, _failed: true } : m
            ),
          }));
          return { ...old, pages };
        }
      );
      toast.error('Failed to send message');
    },
  });

  // ── Edit message ────────────────────────────────────────────────────────────
  const editMutation = useMutation({
    mutationFn: (vars: { messageId: string; content: string }) =>
      editMessage(conversation.id, vars.messageId, vars.content),
    onSuccess: (updated) => {
      queryClient.setQueryData<InfiniteData<PaginatedData<Message>>>(
        queryKeys.messages(conversation.id),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              items: p.items.map((m) => (m.id === updated.id ? updated : m)),
            })),
          };
        }
      );
      setEditingMessage(null);
    },
    onError: () => toast.error('Failed to edit message'),
  });

  // ── Delete message ──────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (vars: { messageId: string; forAll: boolean }) =>
      deleteMessage(conversation.id, vars.messageId, vars.forAll),
    onSuccess: (_data, { messageId, forAll }) => {
      if (forAll) {
        queryClient.setQueryData<InfiniteData<PaginatedData<Message>>>(
          queryKeys.messages(conversation.id),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((p) => ({
                ...p,
                items: p.items.map((m) =>
                  m.id === messageId ? { ...m, isDeleted: true, content: null } : m
                ),
              })),
            };
          }
        );
      } else {
        queryClient.setQueryData<InfiniteData<PaginatedData<Message>>>(
          queryKeys.messages(conversation.id),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((p) => ({
                ...p,
                items: p.items.filter((m) => m.id !== messageId),
              })),
            };
          }
        );
      }
    },
    onError: () => toast.error('Failed to delete message'),
  });

  const handleSend = (content: string, replyToId?: string) => {
    if (editingMessage) {
      editMutation.mutate({ messageId: editingMessage.id, content });
      return;
    }
    sendMutation.mutate({ content, replyToId });
    setReplyTo(null);
  };

  const handleDelete = (msg: Message) => {
    const forAll = msg.senderId === user?.id;
    deleteMutation.mutate({ messageId: msg.id, forAll });
  };

  // Typing socket events
  const emitTypingStart = useCallback(() => {
    const socket = getExistingSocket();
    if (socket && !typingSocketRef.current) {
      socket.emit('typing:start', { conversationId: conversation.id });
      typingSocketRef.current = true;
    }
  }, [conversation.id]);

  const emitTypingStop = useCallback(() => {
    const socket = getExistingSocket();
    if (socket && typingSocketRef.current) {
      socket.emit('typing:stop', { conversationId: conversation.id });
      typingSocketRef.current = false;
    }
  }, [conversation.id]);

  // Group messages into clusters (consecutive by same sender)
  const messageClusters = allMessages.map((msg, idx) => {
    const prev = allMessages[idx - 1];
    const isFirstInCluster = !prev || prev.senderId !== msg.senderId;
    return { msg, isFirstInCluster };
  });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl hover:bg-surface-alt transition-colors lg:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
        </button>

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
            {headerAvatar ? (
              <Image src={headerAvatar} alt={headerName} width={36} height={36} className="object-cover w-full h-full" />
            ) : isGroup ? (
              <Users className="w-4 h-4 text-primary" />
            ) : (
              <span className="font-bold text-primary text-xs uppercase">{headerInitials}</span>
            )}
          </div>
          {isPartnerOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-surface rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{headerName}</p>
          <p className="text-xs text-foreground-muted">
            {isPartnerOnline ? 'Online' : isGroup ? `${conversation.participants.length} members` : 'Offline'}
          </p>
        </div>

        <button className="p-2 rounded-xl hover:bg-surface-alt transition-colors" aria-label="More options">
          <MoreVertical className="w-4 h-4 text-foreground-secondary" />
        </button>
      </div>

      {/* ── Messages list ────────────────────────────────────────────────────── */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-y-none py-2"
      >
        {/* Loading older messages indicator */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-3">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Phone className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold text-foreground text-sm">Start the conversation</p>
            <p className="text-xs text-foreground-muted mt-1">Say hi to {headerName}!</p>
          </div>
        ) : (
          messageClusters.map(({ msg, isFirstInCluster }) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === user?.id}
              showAvatar={isFirstInCluster}
              isGroup={isGroup}
              onReply={(m) => { setReplyTo(m); setEditingMessage(null); }}
              onEdit={(m) => { setEditingMessage(m); setReplyTo(null); }}
              onDelete={handleDelete}
            />
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ────────────────────────────────────────────────────────────── */}
      <MessageInput
        onSend={handleSend}
        onTypingStart={emitTypingStart}
        onTypingStop={emitTypingStop}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />
    </div>
  );
}
