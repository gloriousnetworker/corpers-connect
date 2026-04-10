'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MessageCircle, Archive, ChevronRight } from 'lucide-react';
import { getConversations } from '@/lib/api/conversations';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useMessagesStore } from '@/store/messages.store';
import ConversationItem from './ConversationItem';
import ConversationContextSheet from './ConversationContextSheet';
import type { Conversation } from '@/types/models';

// ── localStorage helpers (shared with ConversationContextSheet) ──────────────

function getSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}

interface ConversationListProps {
  activeConversationId: string | null;
  onSelect: (conv: Conversation) => void;
  onOpenArchived: () => void;
}

export default function ConversationList({
  activeConversationId,
  onSelect,
  onOpenArchived,
}: ConversationListProps) {
  const user = useAuthStore((s) => s.user);
  const onlineUsers = useMessagesStore((s) => s.onlineUsers);
  const [search, setSearch] = useState('');
  const [contextConv, setContextConv] = useState<Conversation | null>(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: queryKeys.conversations(),
    queryFn: getConversations,
    staleTime: 30_000,
    enabled: !!user,
  });

  // Re-derive on every render (and on context sheet open/close) so badges update
  const lockedIds = useMemo(() => getSet('cc_locked_convs'), [contextConv]);
  const favIds    = useMemo(() => getSet('cc_fav_convs'),    [contextConv]);

  // Helper: is this conv pinned for the current user?
  const isPinned = (c: Conversation) =>
    !!(c.participants.find((p) => p.userId === user?.id)?.isPinned);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => {
      if (c.name?.toLowerCase().includes(q)) return true;
      return c.participants.some(
        (p) =>
          p.userId !== user?.id &&
          p.user &&
          `${p.user.firstName} ${p.user.lastName}`.toLowerCase().includes(q),
      );
    });
  }, [conversations, search, user?.id]);

  // Split into pinned / regular (favorites are in their own panel, shown in both sections with star indicator)
  const { pinned, regular } = useMemo(() => ({
    pinned:  filtered.filter((c) => isPinned(c)),
    regular: filtered.filter((c) => !isPinned(c)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [filtered, lockedIds]);

  if (!user) return null;

  const renderItem = (conv: Conversation) => {
    const otherId = conv.participants.find((p) => p.userId !== user.id)?.userId;
    return (
      <ConversationItem
        key={conv.id}
        conversation={conv}
        currentUserId={user.id}
        isActive={conv.id === activeConversationId}
        isOnline={!!otherId && onlineUsers.has(otherId)}
        isLocked={lockedIds.has(conv.id)}
        isFavorite={favIds.has(conv.id)}
        onClick={() => onSelect(conv)}
        onLongPress={() => setContextConv(conv)}
        onContextMenu={() => setContextConv(conv)}
      />
    );
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Search */}
        <div className="px-4 py-2 flex-shrink-0">
          <div className="flex items-center gap-2 bg-surface-alt rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-foreground-muted flex-shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted text-foreground"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* Archived button */}
        <button
          onClick={onOpenArchived}
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-alt transition-colors border-b border-border/60 flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center flex-shrink-0">
            <Archive className="w-4 h-4 text-foreground-secondary" />
          </div>
          <span className="text-sm font-medium text-foreground flex-1 text-left">Archived</span>
          <ChevronRight className="w-4 h-4 text-foreground-muted" />
        </button>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-1 p-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-3">
                  <div className="w-12 h-12 rounded-full bg-surface-alt animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-surface-alt rounded animate-pulse w-1/2" />
                    <div className="h-2.5 bg-surface-alt rounded animate-pulse w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-foreground text-sm">
                {search ? 'No results found' : 'No conversations yet'}
              </p>
              <p className="text-xs text-foreground-muted mt-1">
                {search ? 'Try a different name' : 'Tap the pencil icon to start messaging a corper'}
              </p>
            </div>
          ) : (
            <div>
              {/* Pinned section */}
              {pinned.length > 0 && (
                <>
                  <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-foreground-muted uppercase tracking-wide">
                    📌 Pinned
                  </p>
                  <div className="divide-y divide-border/50">
                    {pinned.map(renderItem)}
                  </div>
                </>
              )}

              {/* Regular section */}
              {regular.length > 0 && (
                <>
                  {pinned.length > 0 && (
                    <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-foreground-muted uppercase tracking-wide">
                      All messages
                    </p>
                  )}
                  <div className="divide-y divide-border/50">
                    {regular.map(renderItem)}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Context sheet */}
      {contextConv && (
        <ConversationContextSheet
          open={!!contextConv}
          conversation={contextConv}
          currentUserId={user.id}
          onClose={() => setContextConv(null)}
        />
      )}
    </>
  );
}
