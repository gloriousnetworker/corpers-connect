'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ArrowLeft, Send, ShoppingBag, Check, CheckCheck, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getMessages, sendMessage, markRead } from '@/lib/api/conversations';
import { normalizeMessage } from '@/lib/api/conversations';
import { getMarketplaceConversation } from '@/lib/api/marketplace';
import { getExistingSocket } from '@/lib/socket';
import { queryKeys } from '@/lib/query-keys';
import { useMarketplaceStore } from '@/store/marketplace.store';
import { useAuthStore } from '@/store/auth.store';
import { formatRelativeTime, getInitials, getAvatarUrl } from '@/lib/utils';
import { MessageType } from '@/types/enums';
import type { Message } from '@/types/models';
import type { PaginatedData } from '@/types/api';
import { useTheme } from 'next-themes';

// ── Marketplace wallpaper (amber/orange toned) ────────────────────────────────

function MktBackground({ isDark }: { isDark: boolean }) {
  const c = isDark ? '#f59e0b' : '#d97706';
  const opacity = isDark ? 0.07 : 0.10;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 720"
        preserveAspectRatio="xMidYMid slice" width="100%" height="100%"
        style={{ opacity }}>
        <defs>
          <style>{`
            @keyframes mUp   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
            @keyframes mDown { 0%,100%{transform:translateY(0)} 50%{transform:translateY(7px)}  }
            @keyframes mPulse{ 0%,100%{opacity:1}              50%{opacity:0.25}               }
            @keyframes mSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
            .mu1{animation:mUp   7s ease-in-out infinite}
            .mu2{animation:mUp   9s ease-in-out infinite 2s}
            .mu3{animation:mUp   6s ease-in-out infinite 4.5s}
            .md1{animation:mDown 8s ease-in-out infinite 1s}
            .md2{animation:mDown 10s ease-in-out infinite 3s}
            .mp1{animation:mPulse 4s ease-in-out infinite}
            .mp2{animation:mPulse 6s ease-in-out infinite 2s}
            .ms1{animation:mSpin 20s linear infinite;transform-box:fill-box;transform-origin:center}
          `}</style>
        </defs>
        {/* Shopping bags */}
        <g className="mu1">
          <path d="M28,70 L72,70 L65,100 L35,100 Z" fill="none" stroke={c} strokeWidth="1.8"/>
          <path d="M38,70 Q38,55 50,55 Q62,55 62,70" fill="none" stroke={c} strokeWidth="1.8"/>
          <line x1="43" y1="80" x2="57" y2="80" stroke={c} strokeWidth="1.4"/>
        </g>
        <g className="md1">
          <path d="M290,45 L334,45 L327,75 L297,75 Z" fill="none" stroke={c} strokeWidth="1.8"/>
          <path d="M300,45 Q300,30 312,30 Q324,30 324,45" fill="none" stroke={c} strokeWidth="1.8"/>
        </g>
        {/* Price tags */}
        <g className="mu2">
          <rect x="14" y="200" width="48" height="28" rx="5" fill="none" stroke={c} strokeWidth="1.6"/>
          <circle cx="23" cy="209" r="3" fill="none" stroke={c} strokeWidth="1.4"/>
          <line x1="20" y1="219" x2="52" y2="219" stroke={c} strokeWidth="1.3"/>
          <line x1="20" y1="224" x2="44" y2="224" stroke={c} strokeWidth="1.3"/>
        </g>
        <g className="md2">
          <rect x="304" y="250" width="54" height="30" rx="5" fill="none" stroke={c} strokeWidth="1.6"/>
          <circle cx="314" cy="260" r="3" fill="none" stroke={c} strokeWidth="1.4"/>
          <line x1="311" y1="270" x2="348" y2="270" stroke={c} strokeWidth="1.3"/>
          <line x1="311" y1="276" x2="338" y2="276" stroke={c} strokeWidth="1.3"/>
        </g>
        {/* Stars / sparkles */}
        <g className="mp1">
          <path d="M190,50 L193,60 L203,60 L195,66 L198,76 L190,70 L182,76 L185,66 L177,60 L187,60 Z"
            fill="none" stroke={c} strokeWidth="1.5"/>
        </g>
        <g className="mp2">
          <path d="M50,380 L52,387 L59,387 L53,391 L55,398 L50,394 L45,398 L47,391 L41,387 L48,387 Z"
            fill="none" stroke={c} strokeWidth="1.4"/>
        </g>
        {/* Naira symbol */}
        <g className="mu3">
          <text x="310" y="450" fontSize="36" fill="none" stroke={c} strokeWidth="1.4"
            fontFamily="sans-serif" fontWeight="bold">₦</text>
        </g>
        {/* Hand-shake / deal icon */}
        <g className="md2">
          <path d="M30,580 Q60,560 90,580" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <path d="M30,580 L30,610" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M90,580 L90,610" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
        </g>
        {/* Spinning circle badge */}
        <g className="ms1">
          <circle cx="330" cy="600" r="20" fill="none" stroke={c} strokeWidth="1.5" strokeDasharray="6 4"/>
          <text x="323" y="605" fontSize="11" fill={c} fontFamily="sans-serif">DEAL</text>
        </g>
      </svg>
    </div>
  );
}

let _tempIdCounter = 0;
function newTempId() { return `mkt-temp-${++_tempIdCounter}`; }

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

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return ''; }
}

export default function MarketplaceChatView() {
  const user = useAuthStore((s) => s.user);
  const { activeMarketplaceChatId, goBack, selectListing } = useMarketplaceStore();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [inputText, setInputText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const prevScrollHeight = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const conversationId = activeMarketplaceChatId;

  // ── Fetch marketplace conversation info ────────────────────────────────────
  const { data: mktConv, isLoading: mktLoading } = useQuery({
    queryKey: queryKeys.marketplaceConversation(conversationId ?? ''),
    queryFn: () => getMarketplaceConversation(conversationId!),
    enabled: !!conversationId,
    staleTime: 60_000,
  });

  const isBuyer = mktConv ? mktConv.buyerId === user?.id : false;
  const otherParty = mktConv ? (isBuyer ? mktConv.seller : mktConv.buyer) : null;
  const otherName = otherParty ? `${otherParty.firstName} ${otherParty.lastName}` : 'Loading...';
  const otherInitials = otherParty ? getInitials(otherParty.firstName, otherParty.lastName) : '?';

  // ── Fetch messages ─────────────────────────────────────────────────────────
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: messagesLoading,
  } = useInfiniteQuery({
    queryKey: queryKeys.messages(conversationId ?? ''),
    queryFn: ({ pageParam }) =>
      getMessages(conversationId!, { cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 60_000,
    enabled: !!conversationId,
  });

  const allMessages: Message[] = [...(messagesData?.pages ?? [])]
    .reverse()
    .flatMap((page) => [...page.items].reverse());

  // ── Join socket room ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;
    const socket = getExistingSocket();
    if (socket) socket.emit('conversation:join', conversationId);
    return () => {
      const s = getExistingSocket();
      if (s) s.emit('conversation:leave', conversationId);
    };
  }, [conversationId]);

  // ── Mark messages as read ──────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId || !user) return;
    const unread = allMessages
      .filter((m) => m.senderId !== user.id && !(m.readBy ?? []).includes(user.id))
      .map((m) => m.id);
    if (unread.length > 0) markRead(conversationId, unread).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMessages.length, conversationId, user?.id]);

  // ── Scroll management ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!messagesLoading && bottomRef.current && isAtBottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [messagesLoading, allMessages.length]);

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

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;
    if (el.scrollTop < 80 && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Patch cache helper ─────────────────────────────────────────────────────
  const patchMessages = useCallback(
    (patcher: (m: Message) => Message | null) => {
      if (!conversationId) return;
      queryClient.setQueryData<InfiniteData<PaginatedData<Message>>>(
        queryKeys.messages(conversationId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              items: p.items.map((m) => patcher(m) ?? m).filter(Boolean) as Message[],
            })),
          };
        }
      );
    },
    [queryClient, conversationId]
  );

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (vars: { content: string }) =>
      sendMessage(conversationId!, { content: vars.content }),
    onMutate: async ({ content }) => {
      const tempId = newTempId();
      const optimistic: Message = {
        id: tempId,
        conversationId: conversationId!,
        senderId: user!.id,
        sender: user!,
        content,
        type: MessageType.TEXT,
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
        queryKeys.messages(conversationId!),
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
        queryKeys.messages(conversationId!),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplaceConversations() });
    },
    onError: (_err, _vars, context) => {
      patchMessages((m) => m.id === context?.tempId ? { ...m, _pending: false, _failed: true } : m);
      toast.error('Failed to send message');
    },
  });

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || !conversationId) return;
    sendMutation.mutate({ content: text });
    setInputText('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };

  const handleListingTap = () => {
    if (!mktConv) return;
    selectListing({
      id: mktConv.listing.id,
      title: mktConv.listing.title,
      images: mktConv.listing.images,
      price: mktConv.listing.price,
      status: mktConv.listing.status,
    } as Parameters<typeof selectListing>[0]);
  };

  const messageClusters = allMessages.map((msg, idx) => {
    const prev = allMessages[idx - 1];
    return { msg, isFirstInCluster: !prev || prev.senderId !== msg.senderId };
  });

  if (!conversationId) return null;

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-border bg-surface flex-shrink-0">
        <button
          onClick={goBack}
          className="p-2.5 rounded-xl hover:bg-surface-alt active:bg-surface-alt transition-colors flex-shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        {/* Listing info — tappable */}
        {mktLoading ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0 px-1.5 py-1">
            <div className="w-9 h-9 rounded-lg bg-surface-alt animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-surface-alt rounded animate-pulse w-1/2" />
              <div className="h-2.5 bg-surface-alt rounded animate-pulse w-1/3" />
            </div>
          </div>
        ) : mktConv ? (
          <button
            onClick={handleListingTap}
            className="flex items-center gap-2.5 flex-1 min-w-0 text-left px-1.5 py-1 rounded-xl hover:bg-surface-alt active:bg-surface-alt transition-colors"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center flex-shrink-0 ring-1 ring-amber-200 dark:ring-amber-800">
              {mktConv.listing.images?.[0] ? (
                <Image
                  src={mktConv.listing.images[0]}
                  alt={mktConv.listing.title}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              ) : (
                <ShoppingBag className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{mktConv.listing.title}</p>
              <div className="flex items-center gap-2">
                {mktConv.listing.price != null && (
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    ₦{mktConv.listing.price.toLocaleString('en-NG')}
                  </span>
                )}
                <span className="text-xs text-foreground-muted truncate">with {otherName}</span>
              </div>
            </div>
          </button>
        ) : null}

        {/* Other party avatar */}
        {otherParty && (
          <div className="flex-shrink-0 mr-1">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-amber-100 dark:bg-amber-900/40 ring-2 ring-amber-200 dark:ring-amber-700 flex items-center justify-center">
              {otherParty.profilePicture ? (
                <Image
                  src={getAvatarUrl(otherParty.profilePicture, 72)}
                  alt={otherName}
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                  {otherInitials}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Messages area ──────────────────────────────────────────────────── */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{ backgroundColor: isDark ? '#1a1008' : '#fdf8ef' }}
      >
        <MktBackground isDark={isDark} />
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto overscroll-y-none py-2"
        >
          {isFetchingNextPage && (
            <div className="flex justify-center py-3">
              <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
          )}

          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
          ) : allMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 shadow flex items-center justify-center mb-3">
                <ShoppingBag className="w-7 h-7 text-amber-500" />
              </div>
              <p className="font-semibold text-foreground text-sm">Start the conversation</p>
              <p className="text-xs text-foreground-muted mt-1">
                {mktConv ? `Ask about "${mktConv.listing.title}"` : 'Send a message to get started'}
              </p>
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
                    <span className="text-[11px] font-semibold text-white bg-amber-600/70 dark:bg-amber-800/80 backdrop-blur-sm px-3 py-1 rounded-full shadow">
                      {dayLabel}
                    </span>
                  </div>
                );
              }
              const isOwn = !!user && msg.senderId === user.id;
              items.push(
                <MktBubble
                  key={msg.id}
                  message={msg}
                  isOwn={isOwn}
                  showAvatar={isFirstInCluster && !isOwn}
                  currentUserId={user?.id ?? ''}
                  participantCount={2}
                />
              );
            });
            return items;
          })()}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-border bg-surface px-3 py-2">
        <div className="flex items-center gap-2">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-surface-alt rounded-2xl px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted outline-none resize-none max-h-[120px]"
            style={{ fontSize: '16px' }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sendMutation.isPending}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 active:bg-amber-700 transition-colors flex-shrink-0"
            aria-label="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Message bubble ──────────────────────────────────────────────────────────

interface MktBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  currentUserId: string;
  participantCount: number;
}

function MktBubble({ message, isOwn, showAvatar, currentUserId, participantCount }: MktBubbleProps) {
  const isPending = message._pending;
  const isFailed  = message._failed;

  const renderStatus = () => {
    if (!isOwn) return null;
    if (isFailed) return <AlertCircle className="w-3 h-3 text-red-400" />;
    if (isPending) return <Clock className="w-3 h-3 text-white/50" />;
    const readBy = message.readBy ?? [];
    const allRead = readBy.length >= participantCount - 1 && readBy.length > 0;
    if (allRead) return <CheckCheck className="w-3.5 h-3.5 text-amber-200" />;
    if (readBy.length > 0) return <CheckCheck className="w-3.5 h-3.5 text-white/50" />;
    return <Check className="w-3 h-3 text-white/50" />;
  };

  return (
    <div className={`flex items-end gap-2 px-4 py-0.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${showAvatar ? 'mt-2' : ''}`}>
      {/* Avatar */}
      {!isOwn && (
        <div className="w-7 h-7 flex-shrink-0">
          {showAvatar ? (
            <div className="w-7 h-7 rounded-full overflow-hidden bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              {message.sender?.profilePicture ? (
                <Image
                  src={getAvatarUrl(message.sender.profilePicture, 56)}
                  alt=""
                  width={28}
                  height={28}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                  {getInitials(message.sender?.firstName ?? '', message.sender?.lastName ?? '')}
                </span>
              )}
            </div>
          ) : <div className="w-7" />}
        </div>
      )}

      {/* Bubble */}
      <div
        className={[
          'relative flex flex-col max-w-[72%]',
          isOwn ? 'items-end' : 'items-start',
        ].join(' ')}
      >
        <div
          className={[
            'rounded-2xl px-3 py-2 shadow-sm',
            isOwn
              ? 'bg-amber-500 text-white rounded-br-sm'
              : 'bg-white dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800/50 text-foreground rounded-bl-sm',
            isPending ? 'opacity-60' : '',
            isFailed ? 'opacity-50 border border-red-400' : '',
          ].join(' ')}
        >
          {message.isDeleted ? (
            <p className={`text-sm italic ${isOwn ? 'text-white/70' : 'text-foreground-muted'}`}>
              Message deleted
            </p>
          ) : message.type === MessageType.IMAGE && message.mediaUrl ? (
            <div className="rounded-xl overflow-hidden -mx-1 -mt-0.5 mb-1">
              <Image
                src={message.mediaUrl}
                alt="Photo"
                width={280}
                height={200}
                className="object-cover max-w-full"
              />
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          )}
          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-foreground-muted'}`}>
              {formatTime(message.createdAt)}
            </span>
            {renderStatus()}
            {isFailed && (
              <span className="text-[10px] text-red-400 font-medium flex items-center gap-0.5">
                <RefreshCw className="w-2.5 h-2.5" /> Retry
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
