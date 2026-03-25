'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Search, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createConversation, searchUsers } from '@/lib/api/conversations';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { getInitials } from '@/lib/utils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import ClientPortal from '@/components/ui/ClientPortal';
import type { Conversation } from '@/types/models';

interface NewConversationModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (conversation: Conversation) => void;
}

export default function NewConversationModal({
  open,
  onClose,
  onCreated,
}: NewConversationModalProps) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchUsers>>>([]);
  const [searching, setSearching] = useState(false);

  useBodyScrollLock(open);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const data = await searchUsers(q.trim());
      setResults(data.filter((u) => u.id !== user?.id));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const mutation = useMutation({
    mutationFn: (participantId: string) =>
      createConversation({ type: 'DM', participantId }),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
      toast.success('Conversation started!');
      onCreated(conv);
      onClose();
    },
    onError: () => toast.error('Failed to start conversation'),
  });

  if (!open) return null;

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div
          className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
          style={{ maxHeight: '80dvh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <h3 className="font-semibold text-foreground">New Message</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-surface-alt transition-colors"
            >
              <X className="w-4 h-4 text-foreground-secondary" />
            </button>
          </div>

          {/* Search input */}
          <div className="px-4 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2 bg-surface-alt rounded-xl px-3 py-2.5">
              <Search className="w-4 h-4 text-foreground-muted flex-shrink-0" />
              <input
                type="search"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by name or state code…"
                autoFocus
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted text-foreground"
                style={{ fontSize: '16px' }}
              />
              {searching && <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {query.trim().length < 2 ? (
              <div className="text-center py-10 text-sm text-foreground-muted">
                Type at least 2 characters to search
              </div>
            ) : results.length === 0 && !searching ? (
              <div className="text-center py-10 text-sm text-foreground-muted">
                No corpers found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {results.map((u) => {
                  const initials = getInitials(u.firstName, u.lastName);
                  return (
                    <button
                      key={u.id}
                      onClick={() => mutation.mutate(u.id)}
                      disabled={mutation.isPending}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-alt transition-colors disabled:opacity-60"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {u.profilePicture ? (
                          <Image
                            src={u.profilePicture}
                            alt={initials}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <span className="font-bold text-primary text-sm uppercase">{initials}</span>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-foreground-muted">{u.servingState}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientPortal>
  );
}
