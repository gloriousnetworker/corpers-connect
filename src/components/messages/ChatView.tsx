'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ArrowLeft, Users, Info, X, ShieldCheck } from 'lucide-react';
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
import { useUIStore } from '@/store/ui.store';
import { useMessagesStore } from '@/store/messages.store';
import { getExistingSocket } from '@/lib/socket';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { ConversationType, MessageType } from '@/types/enums';
import type { Conversation, Message } from '@/types/models';
import type { PaginatedData } from '@/types/api';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import ForwardModal from './ForwardModal';
import TypingIndicator from './TypingIndicator';
import GroupInfoSheet from './GroupInfoSheet';
import VoiceNotePlayer from './VoiceNotePlayer';

// WhatsApp-style chat background — subtle repeating pattern
const CHAT_BG_LIGHT = `
  linear-gradient(rgba(229,237,232,0.96), rgba(229,237,232,0.96)),
  url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='%2325D366' opacity='0.25'/%3E%3Ccircle cx='40' cy='10' r='1.5' fill='%2325D366' opacity='0.25'/%3E%3Ccircle cx='70' cy='10' r='1.5' fill='%2325D366' opacity='0.25'/%3E%3Ccircle cx='25' cy='25' r='1.5' fill='%2325D366' opacity='0.25'/%3E%3Ccircle cx='55' cy='25' r='1.5' fill='%2325D366' opacity='0.25'/%3E%3Ccircle cx='10' cy='40' r='1.5' fill='%2325D366' opacity='0.25'/%3E%3Ccircle cx='40' cy='40' r='1.5' fill='%2325D366' opacity='0.25'/%3E%3Ccircle cx='70' cy='40' r='1.5' fill='%2325D366' opacity='0.25'/%3E%3Ccircle cx='25' cy='55' r='1.5' fill='%2325D366' opacity='0.25'/%3E%3Ccircle cx='55' cy='55' r='1.5' fill='%2325D366' opacity='0.25'/%3E%3Ccircle cx='10' cy='70' r='1.5' fill='%2325D366' opacity='0.25'/%3E%3Ccircle cx='40' cy='70' r='1.5' fill='%2325D366' opacity='0.25'/%3E%3Ccircle cx='70' cy='70' r='1.5' fill='%2325D366' opacity='0.25'/%3E%3C/svg%3E")
`.trim();

const CHAT_BG_DARK = `
  linear-gradient(rgba(11,20,26,0.97), rgba(11,20,26,0.97)),
  url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='%2325D366' opacity='0.12'/%3E%3Ccircle cx='40' cy='10' r='1.5' fill='%2325D366' opacity='0.12'/%3E%3Ccircle cx='70' cy='10' r='1.5' fill='%2325D366' opacity='0.12'/%3E%3Ccircle cx='25' cy='25' r='1.5' fill='%2325D366' opacity='0.12'/%3E%3Ccircle cx='55' cy='25' r='1.5' fill='%2325D366' opacity='0.12'/%3E%3Ccircle cx='10' cy='40' r='1.5' fill='%2325D366' opacity='0.12'/%3E%3Ccircle cx='40' cy='40' r='1.5' fill='%2325D366' opacity='0.12'/%3E%3Ccircle cx='70' cy='40' r='1.5' fill='%2325D366' opacity='0.12'/%3E%3Ccircle cx='25' cy='55' r='1.5' fill='%2325D366' opacity='0.12'/%3E%3Ccircle cx='55' cy='55' r='1.5' fill='%2325D366' opacity='0.12'/%3E%3Ccircle cx='10' cy='70' r='1.5' fill='%2325D366' opacity='0.12'/%3E%3Ccircle cx='40' cy='70' r='1.5' fill='%2325D366' opacity='0.12'/%3E%3Ccircle cx='70' cy='70' r='1.5' fill='%2325D366' opacity='0.12'/%3E%3C/svg%3E")
`.trim();

interface ChatViewProps {
  conversation: Conversation;
  onBack: () => void;
}

function getDmPartner(conv: Conversation, currentUserId: string) {
  return conv.participants.find((p) => p.userId !== currentUserId)?.user ?? null;
}

let _tempIdCounter = 0;
function newTempId() { return `temp-${++_tempIdCounter}`; }

const EMPTY_TYPING: string[] = [];

export default function ChatView({ conversation, onBack }: ChatViewProps) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const typingUsers = useMessagesStore((s) => s.typingUsers[conversation.id] ?? EMPTY_TYPING);
  const onlineUsers = useMessagesStore((s) => s.onlineUsers);
  const setTyping = useMessagesStore((s) => s.setTyping);

  const setViewingUser = useUIStore((s) => s.setViewingUser);

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [contactInfoOpen, setContactInfoOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

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
  const dmPartnerLastSeen = !isGroup && dmPartner?.lastSeen
    ? `last seen ${formatRelativeTime(dmPartner.lastSeen)}`
    : null;

  // Detect dark mode
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

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

  // ── Helper to patch message cache ──────────────────────────────────────────
  const patchMessages = useCallback(
    (patcher: (m: Message) => Message | null) => {
      queryClient.setQueryData<InfiniteData<PaginatedData<Message>>>(
        queryKeys.messages(conversation.id),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              items: p.items
                .map((m) => patcher(m) ?? m)
                .filter(Boolean) as Message[],
            })),
          };
        }
      );
    },
    [queryClient, conversation.id]
  );

  // ── Send text message ────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (vars: { content: string; replyToId?: string }) =>
      sendMessage(conversation.id, { content: vars.content, replyToId: vars.replyToId }),
    onMutate: async ({ content, replyToId }) => {
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
      // Replace tempId with realMsg AND deduplicate — the socket event may have
      // already inserted realMsg before onSuccess ran (race condition).
      const seen = new Set<string>();
      queryClient.setQueryData<InfiniteData<PaginatedData<Message>>>(
        queryKeys.messages(conversation.id),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              items: p.items
                .map((m) => m.id === context?.tempId ? realMsg : m)
                .filter((m) => seen.has(m.id) ? false : Boolean(seen.add(m.id))),
            })),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
    },
    onError: (_err, _vars, context) => {
      patchMessages((m) => m.id === context?.tempId ? { ...m, _pending: false, _failed: true } : m);
      toast.error('Failed to send message');
    },
  });

  // ── Send media message ────────────────────────────────────────────────────────
  const sendMediaMutation = useMutation({
    mutationFn: (vars: { mediaUrl: string; type: MessageType }) =>
      sendMessage(conversation.id, { mediaUrl: vars.mediaUrl, type: vars.type }),
    onMutate: async ({ mediaUrl, type }) => {
      const tempId = newTempId();
      const optimistic: Message = {
        id: tempId,
        conversationId: conversation.id,
        senderId: user!.id,
        sender: user!,
        content: null,
        type,
        mediaUrl,
        isEdited: false,
        isDeleted: false,
        replyToId: null,
        replyTo: null,
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
      const seen = new Set<string>();
      queryClient.setQueryData<InfiniteData<PaginatedData<Message>>>(
        queryKeys.messages(conversation.id),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              items: p.items
                .map((m) => m.id === context?.tempId ? realMsg : m)
                .filter((m) => seen.has(m.id) ? false : Boolean(seen.add(m.id))),
            })),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
    },
    onError: (_err, _vars, context) => {
      patchMessages((m) => m.id === context?.tempId ? { ...m, _pending: false, _failed: true } : m);
      toast.error('Failed to send media');
    },
  });

  // ── Edit message ────────────────────────────────────────────────────────────
  const editMutation = useMutation({
    mutationFn: (vars: { messageId: string; content: string }) =>
      editMessage(conversation.id, vars.messageId, vars.content),
    onSuccess: (updated) => {
      patchMessages((m) => (m.id === updated.id ? updated : m));
      setEditingMessage(null);
    },
    onError: () => toast.error('Failed to edit message'),
  });

  // ── Delete message ──────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (vars: { messageId: string; forAll: boolean }) =>
      deleteMessage(conversation.id, vars.messageId, vars.forAll),
    onSuccess: (_data, { messageId, forAll }) => {
      queryClient.setQueryData<InfiniteData<PaginatedData<Message>>>(
        queryKeys.messages(conversation.id),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              items: forAll
                ? p.items.map((m) => m.id === messageId ? { ...m, isDeleted: true, content: null } : m)
                : p.items.filter((m) => m.id !== messageId),
            })),
          };
        }
      );
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

  const handleSendMedia = (mediaUrl: string, type: MessageType) => {
    sendMediaMutation.mutate({ mediaUrl, type });
  };

  const handleDelete = (msg: Message) => {
    const forAll = msg.senderId === user?.id;
    deleteMutation.mutate({ messageId: msg.id, forAll });
  };

  const handleRetry = (msg: Message) => {
    if (msg.type === MessageType.TEXT && msg.content) {
      // Remove failed, resend
      patchMessages((m) => m.id === msg.id ? null : m);
      sendMutation.mutate({ content: msg.content, replyToId: msg.replyToId ?? undefined });
    } else if (msg.mediaUrl && msg.type !== MessageType.TEXT) {
      patchMessages((m) => m.id === msg.id ? null : m);
      sendMediaMutation.mutate({ mediaUrl: msg.mediaUrl, type: msg.type });
    }
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

  // Shared media for contact info sheet
  const sharedImages = allMessages.filter((m) => m.type === MessageType.IMAGE && m.mediaUrl && !m.isDeleted);
  const sharedAudios = allMessages.filter((m) => m.type === MessageType.AUDIO && m.mediaUrl && !m.isDeleted);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-border bg-surface flex-shrink-0">
        {/* Back button — always visible on mobile */}
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl hover:bg-surface-alt active:bg-surface-alt transition-colors flex-shrink-0 lg:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        {/* Profile area — clickable for DMs, plain for groups */}
        {!isGroup ? (
          <button
            onClick={() => setContactInfoOpen(true)}
            className="flex items-center gap-2.5 flex-1 min-w-0 text-left px-1.5 py-1 rounded-xl hover:bg-surface-alt active:bg-surface-alt transition-colors"
          >
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                {headerAvatar ? (
                  <Image src={headerAvatar} alt={headerName} width={36} height={36} className="object-cover w-full h-full" />
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
              <p className="text-xs text-foreground-muted truncate">
                {isPartnerOnline ? 'Online' : dmPartnerLastSeen ?? 'Offline'}
              </p>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-2.5 flex-1 min-w-0 px-1.5 py-1">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                {headerAvatar ? (
                  <Image src={headerAvatar} alt={headerName} width={36} height={36} className="object-cover w-full h-full" />
                ) : (
                  <Users className="w-4 h-4 text-primary" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{headerName}</p>
              <p className="text-xs text-foreground-muted truncate">
                {`${conversation.participants.length} members`}
              </p>
            </div>
          </div>
        )}

        {/* Info button */}
        <button
          onClick={() => isGroup ? setGroupInfoOpen(true) : setContactInfoOpen(true)}
          className="p-2.5 rounded-xl hover:bg-surface-alt active:bg-surface-alt transition-colors flex-shrink-0"
          aria-label={isGroup ? 'Group info' : 'Contact info'}
        >
          <Info className="w-4.5 h-4.5 text-foreground-secondary" />
        </button>
      </div>

      {/* ── Messages list ────────────────────────────────────────────────────── */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-y-none py-2"
        style={{ backgroundImage: isDark ? CHAT_BG_DARK : CHAT_BG_LIGHT, backgroundSize: '80px 80px' }}
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
            <div className="w-16 h-16 rounded-full bg-white/80 shadow flex items-center justify-center mb-3">
              <span className="text-2xl">👋</span>
            </div>
            <p className="font-semibold text-foreground text-sm">Start the conversation</p>
            <p className="text-xs text-foreground-muted mt-1">Say hi to {headerName}!</p>
          </div>
        ) : (
          messageClusters.map(({ msg, isFirstInCluster }) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={!!user && (msg.senderId === user.id || msg.sender?.id === user.id)}
              showAvatar={isFirstInCluster}
              isGroup={isGroup}
              participantCount={conversation.participants.length}
              onReply={(m) => { setReplyTo(m); setEditingMessage(null); }}
              onEdit={(m) => { setEditingMessage(m); setReplyTo(null); }}
              onDelete={handleDelete}
              onRetry={handleRetry}
              onForward={(m) => setForwardingMessage(m)}
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
        onSendMedia={handleSendMedia}
        onTypingStart={emitTypingStart}
        onTypingStop={emitTypingStop}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />

      {/* Group info sheet */}
      {isGroup && (
        <GroupInfoSheet
          open={groupInfoOpen}
          conversation={conversation}
          currentUserId={user?.id ?? ''}
          onClose={() => setGroupInfoOpen(false)}
          onLeave={onBack}
        />
      )}

      {forwardingMessage && (
        <ForwardModal
          message={forwardingMessage}
          currentUserId={user?.id ?? ''}
          onClose={() => setForwardingMessage(null)}
        />
      )}

      {/* ── Contact Info Sheet (DM only) ─────────────────────────────────── */}
      {contactInfoOpen && !isGroup && dmPartner && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setContactInfoOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-sheet max-h-[85dvh] flex flex-col animate-slide-up">
            {/* Sheet header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <span className="font-semibold text-foreground">Contact Info</span>
              <button
                onClick={() => setContactInfoOpen(false)}
                className="p-2 rounded-xl hover:bg-surface-alt transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {/* Profile section */}
              <div className="flex flex-col items-center py-6 px-4">
                <div className="relative mb-3">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                    {dmPartner.profilePicture ? (
                      <Image
                        src={dmPartner.profilePicture}
                        alt={headerName}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary uppercase">{headerInitials}</span>
                    )}
                  </div>
                  {isPartnerOnline && (
                    <span className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-success border-2 border-surface rounded-full" />
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg font-bold text-foreground">{headerName}</h3>
                  {dmPartner.isVerified && (
                    <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>

                <p className="text-sm text-foreground-muted mt-0.5">
                  {isPartnerOnline ? '🟢 Online now' : dmPartnerLastSeen ?? 'Offline'}
                </p>

                {dmPartner.servingState && (
                  <p className="text-xs text-foreground-secondary mt-1">📍 {dmPartner.servingState}</p>
                )}

                {dmPartner.bio && (
                  <p className="text-sm text-foreground-secondary mt-2 text-center px-4 leading-relaxed">{dmPartner.bio}</p>
                )}

                <button
                  onClick={() => {
                    setContactInfoOpen(false);
                    setViewingUser(dmPartner.id, 'messages');
                  }}
                  className="mt-4 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark active:bg-primary-dark transition-colors"
                >
                  View Full Profile
                </button>
              </div>

              {/* Shared media */}
              {sharedImages.length > 0 && (
                <div className="px-4 pb-4 border-t border-border pt-4">
                  <p className="text-sm font-semibold text-foreground mb-3">
                    Shared Media ({sharedImages.length})
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    {sharedImages.slice(0, 9).map((msg) => (
                      <div key={msg.id} className="aspect-square rounded-lg overflow-hidden bg-surface-alt relative">
                        <Image
                          src={msg.mediaUrl!}
                          alt="Shared image"
                          fill
                          className="object-cover"
                          sizes="33vw"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shared audio */}
              {sharedAudios.length > 0 && (
                <div className="px-4 pb-6 border-t border-border pt-4">
                  <p className="text-sm font-semibold text-foreground mb-3">
                    Voice Messages ({sharedAudios.length})
                  </p>
                  <div className="space-y-2">
                    {sharedAudios.slice(0, 5).map((msg) => (
                      <VoiceNotePlayer
                        key={msg.id}
                        mediaUrl={msg.mediaUrl!}
                        isOwn={msg.senderId === user?.id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
