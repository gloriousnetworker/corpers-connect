'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, Search } from 'lucide-react';
import { getConversations } from '@/lib/api/conversations';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useMessagesStore } from '@/store/messages.store';
import ConversationItem from './ConversationItem';
import ConversationContextSheet from './ConversationContextSheet';
import type { Conversation } from '@/types/models';

function getSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}

interface FavoritesPanelProps {
  onBack: () => void;
  onSelect: (conv: Conversation) => void;
}

export default function FavoritesPanel({ onBack, onSelect }: FavoritesPanelProps) {
  const user = useAuthStore((s) => s.user);
  const onlineUsers = useMessagesStore((s) => s.onlineUsers);
  const [search, setSearch] = useState('');
  const [contextConv, setContextConv] = useState<Conversation | null>(null);
  // Re-read on context sheet close so removal reflects immediately
  const [favIds, setFavIds] = useState(() => getSet('cc_fav_convs'));

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: queryKeys.conversations(),
    queryFn: getConversations,
    staleTime: 30_000,
    enabled: !!user,
  });

  const lockedIds = useMemo(() => getSet('cc_locked_convs'), [contextConv]);

  const favConversations = useMemo(
    () => conversations.filter((c) => favIds.has(c.id)),
    [conversations, favIds],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return favConversations;
    const q = search.toLowerCase();
    return favConversations.filter((c) => {
      if (c.name?.toLowerCase().includes(q)) return true;
      return c.participants.some(
        (p) =>
          p.userId !== user?.id &&
          p.user &&
          `${p.user.firstName} ${p.user.lastName}`.toLowerCase().includes(q),
      );
    });
  }, [favConversations, search, user?.id]);

  if (!user) return null;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-alt transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="text-base font-bold text-foreground flex-1">Favorites</h2>
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
        </div>

        {/* Search */}
        <div className="px-4 py-2 flex-shrink-0">
          <div className="flex items-center gap-2 bg-surface-alt rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-foreground-muted flex-shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search favorites…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted text-foreground"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-1 p-2">
              {[1, 2, 3].map((i) => (
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
              <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-3">
                <Star className="w-6 h-6 text-amber-400" />
              </div>
              <p className="font-semibold text-foreground text-sm">
                {search ? 'No results found' : 'No favorite chats yet'}
              </p>
              <p className="text-xs text-foreground-muted mt-1">
                {search
                  ? 'Try a different name'
                  : 'Long-press a chat and tap "Add to favorites"'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((conv) => {
                const otherId = conv.participants.find((p) => p.userId !== user.id)?.userId;
                return (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    currentUserId={user.id}
                    isActive={false}
                    isOnline={!!otherId && onlineUsers.has(otherId)}
                    isLocked={lockedIds.has(conv.id)}
                    isFavorite={true}
                    onClick={() => onSelect(conv)}
                    onLongPress={() => setContextConv(conv)}
                    onContextMenu={() => setContextConv(conv)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {contextConv && (
        <ConversationContextSheet
          open={!!contextConv}
          conversation={contextConv}
          currentUserId={user.id}
          onClose={() => {
            setContextConv(null);
            // Re-read favorites so removals reflect immediately
            setFavIds(getSet('cc_fav_convs'));
          }}
        />
      )}
    </>
  );
}
