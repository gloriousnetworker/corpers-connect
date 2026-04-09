'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { X, Search, Loader2, MessageCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createConversation } from '@/lib/api/conversations';
import { getFollowers } from '@/lib/api/users';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import ClientPortal from '@/components/ui/ClientPortal';
import type { Conversation } from '@/types/models';

// Shape of what getFollowers actually returns per item (backend adds isFollowing)
type FollowerItem = {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string | null;
  isVerified: boolean;
  servingState: string;
  isFollowing?: boolean;
};

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

  useBodyScrollLock(open);

  // ── Load mutual followers on open ──────────────────────────────────────────
  // getFollowers returns followers with isFollowing:true when we also follow them back.
  const { data: followersPage, isLoading: loadingFollowers } = useQuery({
    queryKey: ['mutual-connections', user?.id],
    queryFn: async () => {
      // Fetch up to 100 followers; the authenticated request means the backend
      // sets isFollowing:true for anyone we follow back (= mutual follower).
      const page = await getFollowers(user!.id, undefined, 100);
      return (page.items as FollowerItem[]).filter((u) => u.isFollowing === true);
    },
    enabled: open && !!user,
    staleTime: 60_000,
  });

  const allMutual = followersPage ?? [];

  // ── Filter by search query ─────────────────────────────────────────────────
  const displayResults = useMemo(() => {
    if (!query.trim()) return allMutual;
    const q = query.toLowerCase();
    return allMutual.filter((u) =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
    );
  }, [allMutual, query]);

  // ── Create / open DM ──────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (participantId: string) =>
      createConversation({ type: 'DM', participantId }),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
      onCreated(conv);
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error ? err.message : 'Failed to start conversation';
      toast.error(msg);
    },
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
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter connections…"
                autoFocus
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted text-foreground"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {loadingFollowers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : allMutual.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">No connections yet</p>
                <p className="text-xs mt-1 text-foreground-muted">
                  Follow someone and wait for them to follow back to start chatting
                </p>
              </div>
            ) : displayResults.length === 0 ? (
              <div className="text-center py-10 px-4 text-sm text-foreground-muted">
                No connections match &ldquo;{query}&rdquo;
              </div>
            ) : (
              <>
                {!query.trim() && (
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                    Your Connections ({allMutual.length})
                  </p>
                )}
                <div className="divide-y divide-border/50">
                  {displayResults.map((u) => {
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
                              src={getAvatarUrl(u.profilePicture, 80)}
                              alt={initials}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          ) : (
                            <span className="font-bold text-primary text-sm uppercase">{initials}</span>
                          )}
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-foreground-muted">{u.servingState}</p>
                        </div>
                        {mutation.isPending && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ClientPortal>
  );
}
