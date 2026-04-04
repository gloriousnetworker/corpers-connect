'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { X, Users, UserMinus, UserPlus, LogOut, Search, Loader2, ShieldCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  addParticipants,
  removeParticipant,
  leaveConversation,
  searchUsers,
} from '@/lib/api/conversations';
import { queryKeys } from '@/lib/query-keys';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import ClientPortal from '@/components/ui/ClientPortal';
import { ParticipantRole } from '@/types/enums';
import type { Conversation } from '@/types/models';

type SearchUser = Awaited<ReturnType<typeof searchUsers>>[number];

interface GroupInfoSheetProps {
  open: boolean;
  conversation: Conversation;
  currentUserId: string;
  onClose: () => void;
  onLeave: () => void;
}

export default function GroupInfoSheet({
  open,
  conversation,
  currentUserId,
  onClose,
  onLeave,
}: GroupInfoSheetProps) {
  useBodyScrollLock(open);
  const queryClient = useQueryClient();

  const [showAddSearch, setShowAddSearch] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [addResults, setAddResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);

  const myRole = conversation.participants.find(
    (p) => p.userId === currentUserId
  )?.role;
  const isAdmin = myRole === ParticipantRole.ADMIN;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
    queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversation.id) });
  };

  const addMutation = useMutation({
    mutationFn: (userIds: string[]) => addParticipants(conversation.id, userIds),
    onSuccess: () => {
      invalidate();
      toast.success('Participant added');
      setShowAddSearch(false);
      setAddQuery('');
      setAddResults([]);
    },
    onError: () => toast.error('Failed to add participant'),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeParticipant(conversation.id, userId),
    onSuccess: () => { invalidate(); toast.success('Participant removed'); },
    onError: () => toast.error('Failed to remove participant'),
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveConversation(conversation.id),
    onSuccess: () => {
      invalidate();
      toast.success('You left the group');
      onLeave();
      onClose();
    },
    onError: () => toast.error('Failed to leave group'),
  });

  const handleSearch = useCallback(async (q: string) => {
    setAddQuery(q);
    if (q.trim().length < 2) { setAddResults([]); return; }
    setSearching(true);
    try {
      const data = await searchUsers(q.trim());
      const existingIds = new Set(conversation.participants.map((p) => p.userId));
      setAddResults(
        data.filter(
          (u) =>
            u.id !== currentUserId &&
            !existingIds.has(u.id) &&
            (u.isFollowing ?? false) &&
            (u.followsYou ?? false)
        )
      );
    } catch {
      setAddResults([]);
    } finally {
      setSearching(false);
    }
  }, [conversation.participants, currentUserId]);

  if (!open) return null;

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div
          className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
          style={{ maxHeight: '85dvh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <h3 className="font-semibold text-foreground">Group Info</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-surface-alt transition-colors"
            >
              <X className="w-4 h-4 text-foreground-secondary" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Group identity */}
            <div className="flex flex-col items-center py-6 px-4 border-b border-border">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center mb-3 flex-shrink-0">
                {conversation.picture ? (
                  <Image src={getAvatarUrl(conversation.picture, 160)} alt={conversation.name ?? 'Group'} width={80} height={80} className="object-cover w-full h-full" />
                ) : (
                  <Users className="w-9 h-9 text-primary" />
                )}
              </div>
              <p className="text-base font-bold text-foreground">{conversation.name ?? 'Group'}</p>
              {conversation.description && (
                <p className="text-sm text-foreground-muted mt-1 text-center">{conversation.description}</p>
              )}
              <p className="text-xs text-foreground-muted mt-1">
                {conversation.participants.length} participant{conversation.participants.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Members section */}
            <div className="py-2">
              <div className="flex items-center justify-between px-4 py-2">
                <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">Members</p>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddSearch((v) => !v)}
                    className="flex items-center gap-1 text-xs text-primary font-medium"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add
                  </button>
                )}
              </div>

              {/* Add participant search */}
              {isAdmin && showAddSearch && (
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-2 bg-surface-alt rounded-xl px-3 py-2 mb-2">
                    <Search className="w-4 h-4 text-foreground-muted flex-shrink-0" />
                    <input
                      type="search"
                      value={addQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search to add…"
                      autoFocus
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted text-foreground"
                      style={{ fontSize: '16px' }}
                    />
                    {searching && <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground-muted" />}
                  </div>
                  {addResults.map((u) => {
                    const initials = getInitials(u.firstName, u.lastName);
                    return (
                      <button
                        key={u.id}
                        onClick={() => addMutation.mutate([u.id])}
                        disabled={addMutation.isPending}
                        className="w-full flex items-center gap-3 py-2 text-left hover:bg-surface-alt rounded-xl px-2 transition-colors disabled:opacity-50"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {u.profilePicture ? (
                            <Image src={getAvatarUrl(u.profilePicture, 64)} alt={initials} width={32} height={32} className="object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-primary uppercase">{initials}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-foreground-muted">{u.servingState}</p>
                        </div>
                        <UserPlus className="w-4 h-4 text-primary flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Participant list */}
              <div className="divide-y divide-border/40">
                {conversation.participants.map((p) => {
                  const initials = getInitials(p.user.firstName, p.user.lastName);
                  const isMe = p.userId === currentUserId;
                  return (
                    <div key={p.userId} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {p.user.profilePicture ? (
                          <Image src={getAvatarUrl(p.user.profilePicture, 80)} alt={initials} width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-sm font-bold text-primary uppercase">{initials}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-foreground truncate">
                            {p.user.firstName} {p.user.lastName}{isMe && ' (You)'}
                          </p>
                          {p.role === ParticipantRole.ADMIN && (
                            <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-foreground-muted">{p.role === ParticipantRole.ADMIN ? 'Admin' : 'Member'}</p>
                      </div>
                      {isAdmin && !isMe && (
                        <button
                          onClick={() => removeMutation.mutate(p.userId)}
                          disabled={removeMutation.isPending}
                          className="p-1.5 rounded-full text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                          aria-label={`Remove ${p.user.firstName}`}
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leave group */}
            <div className="px-4 pb-4 pt-2">
              <button
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-danger/30 text-danger text-sm font-semibold hover:bg-danger/5 transition-colors disabled:opacity-50"
              >
                {leaveMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <LogOut className="w-4 h-4" />
                }
                Leave Group
              </button>
            </div>
          </div>
        </div>
      </div>
    </ClientPortal>
  );
}
