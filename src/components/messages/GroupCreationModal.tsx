'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { X, Search, Loader2, Users, Check, ChevronRight } from 'lucide-react';
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

type Connection = {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string | null;
  isVerified: boolean;
  servingState: string;
  isFollowing?: boolean;
};

interface GroupCreationModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (conversation: Conversation) => void;
}

export default function GroupCreationModal({
  open,
  onClose,
  onCreated,
}: GroupCreationModalProps) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [step, setStep] = useState<'select' | 'name'>('select');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Connection[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  useBodyScrollLock(open);

  // Load all mutual connections immediately on open (same as DM modal)
  const { data: connectionsPage, isLoading: loadingConnections } = useQuery({
    queryKey: ['mutual-connections', user?.id],
    queryFn: async () => {
      const page = await getFollowers(user!.id, undefined, 100);
      return (page.items as Connection[]).filter((u) => u.isFollowing === true);
    },
    enabled: open && !!user,
    staleTime: 60_000,
  });

  const allConnections = connectionsPage ?? [];

  // Filter by search query
  const displayResults = useMemo(() => {
    if (!query.trim()) return allConnections.filter((u) => !selected.some((s) => s.id === u.id));
    const q = query.toLowerCase();
    return allConnections.filter(
      (u) =>
        !selected.some((s) => s.id === u.id) &&
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
    );
  }, [allConnections, query, selected]);

  const toggleSelect = (u: Connection) => {
    setSelected((prev) =>
      prev.some((s) => s.id === u.id)
        ? prev.filter((s) => s.id !== u.id)
        : [...prev, u]
    );
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createConversation({
        type: 'GROUP',
        name: groupName.trim(),
        description: groupDesc.trim() || undefined,
        participantIds: selected.map((u) => u.id),
      }),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
      toast.success('Group created!');
      onCreated(conv);
      handleClose();
    },
    onError: () => toast.error('Failed to create group'),
  });

  const handleClose = () => {
    setStep('select');
    setQuery('');
    setSelected([]);
    setGroupName('');
    setGroupDesc('');
    onClose();
  };

  if (!open) return null;

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={handleClose}
      >
        <div
          className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
          style={{ maxHeight: '85dvh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            {step === 'name' ? (
              <button
                onClick={() => setStep('select')}
                className="text-sm text-primary font-medium"
              >
                Back
              </button>
            ) : (
              <div className="w-14" />
            )}
            <h3 className="font-semibold text-foreground">New Group</h3>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full hover:bg-surface-alt transition-colors"
            >
              <X className="w-4 h-4 text-foreground-secondary" />
            </button>
          </div>

          {step === 'select' ? (
            <>
              {/* Selected chips */}
              {selected.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto flex-shrink-0 border-b border-border">
                  {selected.map((u) => (
                    <div key={u.id} className="flex items-center gap-1 bg-primary/10 rounded-full px-2 py-1 flex-shrink-0">
                      <span className="text-xs text-primary font-medium">{u.firstName}</span>
                      <button onClick={() => toggleSelect(u)}>
                        <X className="w-3 h-3 text-primary" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search filter */}
              <div className="px-4 py-3 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-2 bg-surface-alt rounded-xl px-3 py-2.5">
                  <Search className="w-4 h-4 text-foreground-muted flex-shrink-0" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter connections…"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted text-foreground"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

              {/* Connections list */}
              <div className="flex-1 overflow-y-auto">
                {loadingConnections ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : allConnections.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <Users className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
                    <p className="text-sm text-foreground-muted">No connections yet</p>
                    <p className="text-xs text-foreground-muted/70 mt-1">Follow someone and wait for them to follow back</p>
                  </div>
                ) : displayResults.length === 0 ? (
                  <div className="text-center py-10 px-4 text-sm text-foreground-muted">
                    {query.trim() ? `No connections match "${query}"` : 'All your connections are already selected'}
                  </div>
                ) : (
                  <>
                    {!query.trim() && (
                      <p className="px-4 pt-3 pb-1 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                        Your Connections ({allConnections.length})
                      </p>
                    )}
                    <div className="divide-y divide-border/50">
                      {displayResults.map((u) => {
                        const initials = getInitials(u.firstName, u.lastName);
                        return (
                          <button
                            key={u.id}
                            onClick={() => toggleSelect(u)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-alt transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                              {u.profilePicture ? (
                                <Image src={getAvatarUrl(u.profilePicture, 80)} alt={initials} width={40} height={40} className="object-cover" />
                              ) : (
                                <span className="font-bold text-primary text-sm uppercase">{initials}</span>
                              )}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-foreground-muted">{u.servingState}</p>
                            </div>
                            <div className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center flex-shrink-0">
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Next button */}
              <div className="px-4 py-3 border-t border-border flex-shrink-0">
                <button
                  onClick={() => setStep('name')}
                  disabled={selected.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Group info step */}
              <div className="flex-1 overflow-y-auto">
                {/* Group icon placeholder */}
                <div className="flex justify-center pt-6 pb-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-9 h-9 text-primary" />
                  </div>
                </div>

                <div className="px-4 space-y-4 pb-6">
                  {/* Group name */}
                  <div>
                    <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                      Group Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="e.g. NYSC Lagos Batch A"
                      autoFocus
                      maxLength={60}
                      className="mt-1.5 w-full bg-surface-alt rounded-xl px-4 py-3 text-sm text-foreground outline-none placeholder:text-foreground-muted border border-transparent focus:border-primary/30 transition-colors"
                      style={{ fontSize: '16px' }}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                      Description <span className="text-foreground-muted font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={groupDesc}
                      onChange={(e) => setGroupDesc(e.target.value)}
                      placeholder="What's this group about?"
                      maxLength={200}
                      rows={3}
                      className="mt-1.5 w-full bg-surface-alt rounded-xl px-4 py-3 text-sm text-foreground outline-none placeholder:text-foreground-muted resize-none border border-transparent focus:border-primary/30 transition-colors"
                      style={{ fontSize: '16px' }}
                    />
                  </div>

                  {/* Members summary */}
                  <div className="bg-surface-alt rounded-xl px-4 py-3">
                    <p className="text-xs text-foreground-muted mb-2">{selected.length} participant{selected.length !== 1 ? 's' : ''}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.map((u) => (
                        <span key={u.id} className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
                          {u.firstName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Create button */}
              <div className="px-4 py-3 border-t border-border flex-shrink-0">
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={!groupName.trim() || createMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Create Group'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </ClientPortal>
  );
}
