'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArchiveRestore, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getArchivedConversations, updateConversationSettings } from '@/lib/api/conversations';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useMessagesStore } from '@/store/messages.store';
import ConversationItem from './ConversationContextSheet';
import type { Conversation } from '@/types/models';
import ConversationContextSheet from './ConversationContextSheet';

// We re-import ConversationItem properly
import CI from './ConversationItem';

interface ArchivedConversationsProps {
  onBack: () => void;
  onSelect: (conv: Conversation) => void;
}

export default function ArchivedConversations({ onBack, onSelect }: ArchivedConversationsProps) {
  const user = useAuthStore((s) => s.user);
  const onlineUsers = useMessagesStore((s) => s.onlineUsers);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [contextConv, setContextConv] = useState<Conversation | null>(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['archived-conversations'],
    queryFn: getArchivedConversations,
    enabled: !!user,
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => {
      if (c.name?.toLowerCase().includes(q)) return true;
      return c.participants.some(
        (p) => p.userId !== user?.id && p.user &&
          `${p.user.firstName} ${p.user.lastName}`.toLowerCase().includes(q),
      );
    });
  }, [conversations, search, user?.id]);

  const unarchiveMutation = useMutation({
    mutationFn: (convId: string) => updateConversationSettings(convId, { isArchived: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archived-conversations'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
      toast.success('Moved back to chats');
    },
    onError: () => toast.error('Failed to unarchive'),
  });

  if (!user) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-surface-alt transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-foreground-secondary" />
        </button>
        <h2 className="text-base font-bold text-foreground flex-1">Archived</h2>
      </div>

      {/* Search */}
      <div className="px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-surface-alt rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-foreground-muted flex-shrink-0" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search archived…"
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
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12 gap-3">
            <div className="w-14 h-14 rounded-full bg-surface-alt flex items-center justify-center">
              <ArchiveRestore className="w-6 h-6 text-foreground-muted" />
            </div>
            <p className="font-semibold text-foreground text-sm">No archived chats</p>
            <p className="text-xs text-foreground-muted">Archived chats will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((conv) => {
              const otherId = conv.participants.find((p) => p.userId !== user.id)?.userId;
              return (
                <div key={conv.id} className="relative group">
                  <CI
                    conversation={conv}
                    currentUserId={user.id}
                    isOnline={!!otherId && onlineUsers.has(otherId)}
                    onClick={() => onSelect(conv)}
                    onLongPress={() => setContextConv(conv)}
                    onContextMenu={() => setContextConv(conv)}
                  />
                  {/* Quick unarchive button */}
                  <button
                    onClick={() => unarchiveMutation.mutate(conv.id)}
                    disabled={unarchiveMutation.isPending}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-surface-alt hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40"
                    title="Unarchive"
                  >
                    <ArchiveRestore className="w-4 h-4 text-primary" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
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
    </div>
  );
}
