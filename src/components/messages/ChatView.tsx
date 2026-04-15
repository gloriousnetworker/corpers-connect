'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ArrowLeft, Users, Info, X, ShieldCheck, Pin, Phone, Video, Search, BookOpen, ChevronDown } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getMessages,
  searchMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markRead,
  reactToMessage,
  removeMessageReaction,
  pinMessage,
  lockMessage,
  unlockMessage,
} from '@/lib/api/conversations';
import { getStoryById } from '@/lib/api/stories';
import { normalizeMessage } from '@/lib/api/conversations';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useMessagesStore } from '@/store/messages.store';
import { useCallsStore } from '@/store/calls.store';
import { getExistingSocket, getExistingCallsSocket } from '@/lib/socket';
import { getInitials, formatRelativeTime, getAvatarUrl } from '@/lib/utils';
import { CallType, ConversationType, MessageType } from '@/types/enums';
import type { Conversation, Message, Story } from '@/types/models';
import type { PaginatedData } from '@/types/api';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import ForwardModal from './ForwardModal';
import DeleteMessageSheet from './DeleteMessageSheet';
import TypingIndicator from './TypingIndicator';
import GroupInfoSheet from './GroupInfoSheet';
import VoiceNotePlayer from './VoiceNotePlayer';
import ChatBackground from './ChatBackground';

interface ChatViewProps {
  conversation: Conversation;
  onBack: () => void;
}

function getDmPartner(conv: Conversation, currentUserId: string) {
  return conv.participants.find((p) => p.userId !== currentUserId)?.user ?? null;
}

let _tempIdCounter = 0;
function newTempId() { return `temp-${++_tempIdCounter}`; }

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Split text on query matches and wrap each match in a <mark>. Output used with dangerouslySetInnerHTML — each part is HTML-escaped. */
function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return esc(text);
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${escapedQuery})`, 'gi');
  return text
    .split(re)
    .map((part, i) =>
      i % 2 === 1
        ? `<mark class="bg-amber-200 dark:bg-amber-800 rounded px-0.5">${esc(part)}</mark>`
        : esc(part)
    )
    .join('');
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDay.getTime() === today.getTime()) return 'Today';
  if (msgDay.getTime() === yesterday.getTime()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const EMPTY_TYPING: string[] = [];

export default function ChatView({ conversation, onBack }: ChatViewProps) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const typingUsers = useMessagesStore((s) => s.typingUsers[conversation.id] ?? EMPTY_TYPING);
  const onlineUsers = useMessagesStore((s) => s.onlineUsers);
  const setTyping = useMessagesStore((s) => s.setTyping);

  const setViewingUser = useUIStore((s) => s.setViewingUser);

  // Derive early — needed by both call logic and header render
  const isGroup   = conversation.type === ConversationType.GROUP;
  const dmPartner = getDmPartner(conversation, user?.id ?? '');

  // ── Calls ──────────────────────────────────────────────────────────────────
  const setOutboundCall = useCallsStore((s) => s.setOutboundCall);
  const activeCall      = useCallsStore((s) => s.activeCall);
  const outboundCall    = useCallsStore((s) => s.outboundCall);

  const initiateCall = useCallback(async (type: CallType) => {
    if (!user || !dmPartner) return;
    if (activeCall || outboundCall) return;

    const socket = getExistingCallsSocket();
    if (!socket) return;

    socket.emit(
      'call:initiate',
      { receiverId: dmPartner.id, type },
      (res: { success: boolean; data?: { callId: string; channelName: string; token: string; appId: string }; error?: string }) => {
        if (!res.success || !res.data) return;
        const { callId, channelName, token, appId } = res.data;
        setOutboundCall({ callId, type, partner: dmPartner, channelName, token, appId });
      },
    );
  }, [user, dmPartner, activeCall, outboundCall, setOutboundCall]);

  const initiateGroupCall = useCallback(async (type: CallType) => {
    if (!user || !isGroup) return;
    if (activeCall || outboundCall) return;

    const socket = getExistingCallsSocket();
    if (!socket) return;

    socket.emit(
      'call:initiate-group',
      { conversationId: conversation.id, type },
      (res: { success: boolean; data?: { callId: string; channelName: string; token: string; uid: number; appId: string }; error?: string }) => {
        if (!res.success || !res.data) {
          toast.error('Could not start group call');
          return;
        }
        const { callId, channelName, token, uid, appId } = res.data;
        // For group calls the caller is also a participant — use the returned uid
        setOutboundCall({
          callId,
          type,
          partner: { id: conversation.id, firstName: conversation.name ?? 'Group', lastName: '', profilePicture: conversation.picture } as import('@/types/models').User,
          channelName,
          token,
          appId,
          uid,
        } as import('@/store/calls.store').OutboundCallData);
      },
    );
  }, [user, isGroup, conversation, activeCall, outboundCall, setOutboundCall]);

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [contactInfoOpen, setContactInfoOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef(0);
  const isAtBottomRef = useRef(true);
  const typingSocketRef = useRef(false);

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

  // ── Search within conversation ────────────────────────────────────────────
  // Debounce the search query so we don't fire on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: searchData,
    isLoading: searchLoading,
    fetchNextPage: fetchMoreSearchResults,
    hasNextPage: hasMoreSearchResults,
    isFetchingNextPage: fetchingMoreSearchResults,
  } = useInfiniteQuery({
    queryKey: queryKeys.messageSearch(conversation.id, debouncedQuery),
    queryFn: ({ pageParam }) =>
      searchMessages(conversation.id, debouncedQuery, { cursor: pageParam as string | undefined }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: searchOpen && debouncedQuery.trim().length >= 2,
    staleTime: 30_000,
  });

  const searchResults: Message[] = searchData?.pages.flatMap((p) => p.items) ?? [];

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
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;
    isAtBottomRef.current = atBottom;
    setShowScrollBtn(!atBottom);
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

  // ── Join socket room + reaction/pin socket events ──────────────────────────
  useEffect(() => {
    const socket = getExistingSocket();
    if (socket) socket.emit('conversation:join', conversation.id);

    const handleReact = (payload: { messageId: string; message: unknown }) => {
      const updated = normalizeMessage(payload.message as Parameters<typeof normalizeMessage>[0]);
      patchMessages((m) => m.id === payload.messageId ? updated : m);
    };

    const handlePinned = (payload: { messageId: string; isPinned: boolean; message: unknown }) => {
      const updated = normalizeMessage(payload.message as Parameters<typeof normalizeMessage>[0]);
      patchMessages((m) => m.id === payload.messageId ? updated : m);
      setPinnedMessage(payload.isPinned ? updated : null);
    };

    socket?.on('message:react', handleReact);
    socket?.on('message:pinned', handlePinned);

    return () => {
      const s = getExistingSocket();
      if (s) {
        s.emit('conversation:leave', conversation.id);
        s.off('message:react', handleReact);
        s.off('message:pinned', handlePinned);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        isPinned: false,
        reactions: [],
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
        isPinned: false,
        reactions: [],
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
                // Don't null content — users who locked the message still need it
                ? p.items.map((m) => m.id === messageId ? { ...m, isDeleted: true } : m)
                : p.items.filter((m) => m.id !== messageId),
            })),
          };
        }
      );
    },
    onError: () => toast.error('Failed to delete message'),
  });

  // ── React to message ────────────────────────────────────────────────────────
  const reactionMutation = useMutation({
    mutationFn: (vars: { messageId: string; emoji: string; hasReaction: boolean }) =>
      vars.hasReaction
        ? removeMessageReaction(conversation.id, vars.messageId, vars.emoji)
        : reactToMessage(conversation.id, vars.messageId, vars.emoji),
    onSuccess: (updated) => {
      patchMessages((m) => m.id === updated.id ? updated : m);
    },
    onError: () => toast.error('Failed to update reaction'),
  });

  // ── Pin message ─────────────────────────────────────────────────────────────
  const pinMutation = useMutation({
    mutationFn: (vars: { messageId: string; isPinned: boolean }) =>
      pinMessage(conversation.id, vars.messageId, vars.isPinned),
    onMutate: ({ messageId, isPinned }) => {
      patchMessages((m) => m.id === messageId ? { ...m, isPinned } : m);
    },
    onSuccess: (updated) => {
      patchMessages((m) => m.id === updated.id ? updated : m);
      setPinnedMessage(updated.isPinned ? updated : null);
    },
    onError: (_err, vars) => {
      patchMessages((m) => m.id === vars.messageId ? { ...m, isPinned: !vars.isPinned } : m);
      toast.error('Failed to pin message');
    },
  });

  const handleReact = (msg: Message, emoji: string) => {
    const hasReaction = (msg.reactions ?? []).some((r) => r.userId === user?.id && r.emoji === emoji);
    reactionMutation.mutate({ messageId: msg.id, emoji, hasReaction });
  };

  const handlePin = (msg: Message) => {
    pinMutation.mutate({ messageId: msg.id, isPinned: !msg.isPinned });
  };

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

  // Opens the delete options sheet instead of deleting immediately
  const handleDelete = (msg: Message) => {
    setDeletingMessage(msg);
  };

  // ── Lock / unlock message ───────────────────────────────────────────────────
  const lockMutation = useMutation({
    mutationFn: (vars: { messageId: string; lock: boolean }) =>
      vars.lock
        ? lockMessage(conversation.id, vars.messageId)
        : unlockMessage(conversation.id, vars.messageId),
    onMutate: ({ messageId, lock }) => {
      patchMessages((m) => {
        if (m.id !== messageId) return m;
        const lockedFor = m.lockedFor ?? [];
        return {
          ...m,
          lockedFor: lock
            ? [...lockedFor, user!.id]
            : lockedFor.filter((id) => id !== user!.id),
        };
      });
    },
    onError: (err, { lock }) => {
      // Revert optimistic update
      toast.error(lock ? 'Failed to lock message' : 'Failed to unlock message');
    },
  });

  const handleLockMessage = (msg: Message) => {
    const alreadyLocked = (msg.lockedFor ?? []).includes(user?.id ?? '');
    lockMutation.mutate({ messageId: msg.id, lock: !alreadyLocked });
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

  const handleOpenStory = useCallback(async (storyId: string) => {
    try {
      const story = await getStoryById(storyId);
      setViewingStory(story);
    } catch {
      toast.error('This story has expired or is no longer available');
    }
  }, []);

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
    <div className="flex flex-col h-full relative">
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
                  <Image src={getAvatarUrl(headerAvatar, 72)} alt={headerName} width={36} height={36} className="object-cover w-full h-full" />
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
                  <Image src={getAvatarUrl(headerAvatar, 72)} alt={headerName} width={36} height={36} className="object-cover w-full h-full" />
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

        {/* Call buttons — DM only */}
        {!isGroup ? (
          <>
            <button
              onClick={() => initiateCall(CallType.VOICE)}
              disabled={!!(activeCall || outboundCall)}
              className="p-2.5 rounded-xl hover:bg-surface-alt active:bg-surface-alt transition-colors flex-shrink-0 disabled:opacity-40"
              aria-label="Voice call"
            >
              <Phone className="w-4.5 h-4.5 text-foreground-secondary" />
            </button>
            <button
              onClick={() => initiateCall(CallType.VIDEO)}
              disabled={!!(activeCall || outboundCall)}
              className="p-2.5 rounded-xl hover:bg-surface-alt active:bg-surface-alt transition-colors flex-shrink-0 disabled:opacity-40"
              aria-label="Video call"
            >
              <Video className="w-4.5 h-4.5 text-foreground-secondary" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => initiateGroupCall(CallType.VOICE)}
              disabled={!!(activeCall || outboundCall)}
              className="p-2.5 rounded-xl hover:bg-surface-alt active:bg-surface-alt transition-colors flex-shrink-0 disabled:opacity-40"
              aria-label="Group voice call"
            >
              <Phone className="w-4.5 h-4.5 text-foreground-secondary" />
            </button>
            <button
              onClick={() => initiateGroupCall(CallType.VIDEO)}
              disabled={!!(activeCall || outboundCall)}
              className="p-2.5 rounded-xl hover:bg-surface-alt active:bg-surface-alt transition-colors flex-shrink-0 disabled:opacity-40"
              aria-label="Group video call"
            >
              <Video className="w-4.5 h-4.5 text-foreground-secondary" />
            </button>
          </>
        )}

        {/* Search toggle */}
        <button
          onClick={() => {
            setSearchOpen((v) => {
              if (!v) setTimeout(() => searchInputRef.current?.focus(), 50);
              else { setSearchQuery(''); setDebouncedQuery(''); }
              return !v;
            });
          }}
          className={`p-2.5 rounded-xl hover:bg-surface-alt active:bg-surface-alt transition-colors flex-shrink-0 ${searchOpen ? 'text-primary' : ''}`}
          aria-label="Search messages"
        >
          <Search className="w-4.5 h-4.5 text-foreground-secondary" />
        </button>

        {/* Info button */}
        <button
          onClick={() => isGroup ? setGroupInfoOpen(true) : setContactInfoOpen(true)}
          className="p-2.5 rounded-xl hover:bg-surface-alt active:bg-surface-alt transition-colors flex-shrink-0"
          aria-label={isGroup ? 'Group info' : 'Contact info'}
        >
          <Info className="w-4.5 h-4.5 text-foreground-secondary" />
        </button>
      </div>

      {/* ── Search bar ───────────────────────────────────────────────────────── */}
      {searchOpen && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface flex-shrink-0">
          <Search className="w-4 h-4 text-foreground-muted flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted text-foreground"
            style={{ fontSize: '16px' }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}
              className="text-foreground-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ── Pinned message banner ─────────────────────────────────────────── */}
      {pinnedMessage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border-b border-primary/20 flex-shrink-0">
          <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <p className="flex-1 text-xs text-foreground-secondary truncate">
            <span className="font-medium text-primary">Pinned: </span>
            {pinnedMessage.isDeleted ? 'Deleted message' : pinnedMessage.content ?? '📎 Media'}
          </p>
          <button
            onClick={() => setPinnedMessage(null)}
            className="text-foreground-muted hover:text-foreground transition-colors"
            aria-label="Dismiss pinned message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Search results (replaces message list when active) ───────────────── */}
      {searchOpen && debouncedQuery.trim().length >= 2 ? (
        <div className="flex-1 overflow-y-auto divide-y divide-border/50 bg-surface">
          {searchLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <p className="text-sm text-foreground-muted">No messages found for &ldquo;{debouncedQuery}&rdquo;</p>
            </div>
          ) : (
            <>
              {searchResults.map((msg) => {
                const isOwn = !!user && msg.senderId === user.id;
                const senderName = isOwn
                  ? 'You'
                  : `${msg.sender?.firstName ?? ''} ${msg.sender?.lastName ?? ''}`.trim();
                return (
                  <div key={msg.id} className="flex gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary uppercase">
                      {getInitials(msg.sender?.firstName ?? '', msg.sender?.lastName ?? '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-foreground">{senderName}</span>
                        <span className="text-[11px] text-foreground-muted">{formatRelativeTime(msg.createdAt)}</span>
                      </div>
                      <p
                        className="text-sm text-foreground-muted leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: highlightMatch(msg.content ?? '(media)', debouncedQuery) }}
                      />
                    </div>
                  </div>
                );
              })}
              {hasMoreSearchResults && (
                <div className="p-4 text-center">
                  <button
                    onClick={() => fetchMoreSearchResults()}
                    disabled={fetchingMoreSearchResults}
                    className="text-sm text-primary font-semibold disabled:opacity-50"
                  >
                    {fetchingMoreSearchResults ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
      /* ── Messages list ────────────────────────────────────────────────────── */
      <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: isDark ? '#0f172a' : '#f0f4f8' }}>
        {/* Animated doodle wallpaper — fixed behind messages */}
        <ChatBackground isDark={isDark} />
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto overscroll-y-none py-2"
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
        ) : (() => {
          const items: React.ReactNode[] = [];
          let lastDayLabel = '';
          messageClusters.forEach(({ msg, isFirstInCluster }) => {
            const dayLabel = formatDayLabel(msg.createdAt);
            if (dayLabel !== lastDayLabel) {
              lastDayLabel = dayLabel;
              items.push(
                <div key={`day-${msg.id}`} className="flex items-center justify-center py-3">
                  <span className="text-[11px] font-semibold text-white bg-black/35 dark:bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full shadow">
                    {dayLabel}
                  </span>
                </div>
              );
            }
            items.push(
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
                onReact={handleReact}
                onPin={handlePin}
                onLock={handleLockMessage}
                currentUserId={user?.id ?? ''}
                onOpenStory={handleOpenStory}
              />
            );
          });
          return items;
        })()}

        {/* Typing indicator */}
        {typingUsers.length > 0 && <TypingIndicator />}

        <div ref={bottomRef} />
        </div>

        {/* Scroll-to-bottom button — appears when user scrolls up */}
        {showScrollBtn && (
          <button
            onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full bg-surface shadow-lg border border-border flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Scroll to latest message"
          >
            <ChevronDown className="w-5 h-5 text-foreground-secondary" />
          </button>
        )}
      </div>
      )} {/* end search ternary */}

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

      {deletingMessage && (
        <DeleteMessageSheet
          message={deletingMessage}
          isOwn={deletingMessage.senderId === user?.id}
          onDeleteForMe={() => {
            deleteMutation.mutate({ messageId: deletingMessage.id, forAll: false });
            setDeletingMessage(null);
          }}
          onDeleteForEveryone={() => {
            deleteMutation.mutate({ messageId: deletingMessage.id, forAll: true });
            setDeletingMessage(null);
          }}
          onClose={() => setDeletingMessage(null)}
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
                        src={getAvatarUrl(dmPartner.profilePicture, 192)}
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
      {/* ── Story viewer modal (story-reply tap) ───────────────────────────── */}
      {viewingStory && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-black/80 flex-shrink-0">
            <button
              onClick={() => setViewingStory(null)}
              className="p-2 rounded-full text-white hover:bg-white/10"
              aria-label="Close story"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {viewingStory.author.profilePicture ? (
                <Image
                  src={viewingStory.author.profilePicture}
                  alt=""
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary uppercase">
                    {viewingStory.author.firstName?.[0]}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {viewingStory.author.firstName} {viewingStory.author.lastName}&apos;s Story
                </p>
                {viewingStory.caption && (
                  <p className="text-white/60 text-xs truncate">{viewingStory.caption}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 text-white/50">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-xs">{viewingStory.viewCount ?? 0}</span>
            </div>
          </div>
          {/* Story media */}
          <div className="flex-1 relative flex items-center justify-center bg-black">
            {viewingStory.mediaType?.startsWith('video') ? (
              <video
                src={viewingStory.mediaUrl}
                autoPlay
                playsInline
                controls
                className="max-w-full max-h-full"
              />
            ) : (
              <Image
                src={viewingStory.mediaUrl}
                alt="Story"
                width={1080}
                height={1920}
                className="max-w-full max-h-full object-contain"
                priority
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
