'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ArrowLeft, Send, ShoppingBag } from 'lucide-react';
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
import { formatRelativeTime, getInitials, getAvatarUrl, formatPrice } from '@/lib/utils';
import { MessageType } from '@/types/enums';
import type { Message } from '@/types/models';
import type { PaginatedData } from '@/types/api';

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
  } catch {
    return '';
  }
}

export default function MarketplaceChatView() {
  const user = useAuthStore((s) => s.user);
  const { activeMarketplaceChatId, goBack, selectListing } = useMarketplaceStore();
  const queryClient = useQueryClient();

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

  // Flatten + reverse for display (oldest at top, newest at bottom)
  const allMessages: Message[] = [...(messagesData?.pages ?? [])]
    .reverse()
    .flatMap((page) => [...page.items].reverse());

  // ── Join socket room + listen for new messages ─────────────────────────────
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
    if (unread.length > 0) {
      markRead(conversationId, unread).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMessages.length, conversationId, user?.id]);

  // ── Scroll to bottom on initial load / new messages ────────────────────────
  useEffect(() => {
    if (!messagesLoading && bottomRef.current && isAtBottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [messagesLoading, allMessages.length]);

  // ── Preserve scroll position when loading older messages ───────────────────
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

  // ── Infinite scroll (scroll to top = load older) ──────────────────────────
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;
    if (el.scrollTop < 80 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Patch message cache helper ─────────────────────────────────────────────
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
              items: p.items
                .map((m) => patcher(m) ?? m)
                .filter(Boolean) as Message[],
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
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };

  // Navigate to listing detail
  const handleListingTap = () => {
    if (!mktConv) return;
    // We need to construct a minimal listing object for the store
    const listing = mktConv.listing;
    selectListing({
      id: listing.id,
      title: listing.title,
      images: listing.images,
      price: listing.price,
      status: listing.status,
    } as Parameters<typeof selectListing>[0]);
  };

  // Group messages into clusters
  const messageClusters = allMessages.map((msg, idx) => {
    const prev = allMessages[idx - 1];
    const isFirstInCluster = !prev || prev.senderId !== msg.senderId;
    return { msg, isFirstInCluster };
  });

  if (!conversationId) return null;

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-border bg-surface flex-shrink-0">
        {/* Back */}
        <button
          onClick={goBack}
          className="p-2.5 rounded-xl hover:bg-surface-alt active:bg-surface-alt transition-colors flex-shrink-0"
          aria-label="Back to conversations"
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
            {/* Listing thumbnail */}
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-surface-alt flex items-center justify-center flex-shrink-0">
              {mktConv.listing.images?.[0] ? (
                <Image
                  src={mktConv.listing.images[0]}
                  alt={mktConv.listing.title}
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                />
              ) : (
                <ShoppingBag className="w-4 h-4 text-foreground-muted" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{mktConv.listing.title}</p>
              <div className="flex items-center gap-2">
                {mktConv.listing.price != null && (
                  <span className="text-xs font-semibold text-primary">{formatPrice(mktConv.listing.price)}</span>
                )}
                <span className="text-xs text-foreground-muted truncate">
                  with {otherName}
                </span>
              </div>
            </div>
          </button>
        ) : null}

        {/* Other party avatar */}
        {otherParty && (
          <div className="flex-shrink-0 mr-1">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
              {otherParty.profilePicture ? (
                <Image
                  src={getAvatarUrl(otherParty.profilePicture, 64)}
                  alt={otherName}
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-[10px] font-bold text-primary uppercase">{otherInitials}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Messages area ──────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden bg-surface-alt/30">
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto overscroll-y-none py-2 px-3"
        >
          {/* Loading older */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-3">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : allMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-full bg-white/80 shadow flex items-center justify-center mb-3">
                <ShoppingBag className="w-7 h-7 text-primary" />
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
                    <span className="text-[11px] font-semibold text-foreground-muted bg-surface px-3 py-1 rounded-full shadow-sm">
                      {dayLabel}
                    </span>
                  </div>
                );
              }
              const isOwn = !!user && msg.senderId === user.id;
              items.push(
                <MarketplaceMessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={isOwn}
                  showAvatar={isFirstInCluster && !isOwn}
                  senderInitials={getInitials(msg.sender?.firstName ?? '', msg.sender?.lastName ?? '')}
                  senderAvatar={msg.sender?.profilePicture ?? null}
                />
              );
            });
            return items;
          })()}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Message input ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-border bg-surface px-3 py-2">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-surface-alt rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted outline-none resize-none max-h-[120px]"
            style={{ fontSize: '16px' }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sendMutation.isPending}
            className="p-2.5 rounded-xl bg-primary text-white disabled:opacity-40 hover:bg-primary-dark active:bg-primary-dark transition-colors flex-shrink-0"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Message bubble ──────────────────────────────────────────────────────────

interface MarketplaceMessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  senderInitials: string;
  senderAvatar: string | null;
}

function MarketplaceMessageBubble({ message, isOwn, showAvatar, senderInitials, senderAvatar }: MarketplaceMessageBubbleProps) {
  const isPending = (message as Message & { _pending?: boolean })._pending;
  const isFailed = (message as Message & { _failed?: boolean })._failed;

  return (
    <div className={`flex gap-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-2' : ''}`}>
      {/* Avatar for received messages */}
      {!isOwn && (
        <div className="flex-shrink-0 w-7 self-end">
          {showAvatar ? (
            <div className="w-7 h-7 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
              {senderAvatar ? (
                <Image
                  src={getAvatarUrl(senderAvatar, 56)}
                  alt="avatar"
                  width={28}
                  height={28}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-[9px] font-bold text-primary uppercase">{senderInitials}</span>
              )}
            </div>
          ) : (
            <div className="w-7" />
          )}
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[78%] rounded-2xl px-3 py-2 ${
          isOwn
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-surface shadow-sm rounded-bl-sm text-foreground'
        } ${isPending ? 'opacity-60' : ''} ${isFailed ? 'opacity-50 border border-red-400' : ''}`}
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
          {isFailed && (
            <span className="text-[10px] text-red-400 font-medium">Failed</span>
          )}
        </div>
      </div>
    </div>
  );
}
