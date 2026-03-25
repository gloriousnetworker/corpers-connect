'use client';

import { useState } from 'react';
import { ArrowLeft, MoreVertical, Flag, UserX, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUIStore } from '@/store/ui.store';
import { useMessagesStore } from '@/store/messages.store';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from '@/lib/query-keys';
import { getUserProfile, blockUser } from '@/lib/api/users';
import { createConversation } from '@/lib/api/conversations';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfilePostGrid from '@/components/profile/ProfilePostGrid';
import FollowButton from '@/components/profile/FollowButton';
import FollowersModal from '@/components/profile/FollowersModal';
import type { Post } from '@/types/models';

export default function UserProfileSection() {
  const viewingUserId = useUIStore((s) => s.viewingUserId);
  const previousSection = useUIStore((s) => s.previousSection);
  const setActiveSection = useUIStore((s) => s.setActiveSection);
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const setPendingConversation = useMessagesStore((s) => s.setPendingConversation);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [followersOpen, setFollowersOpen] = useState(false);
  const [followersInitialTab, setFollowersInitialTab] = useState<'followers' | 'following'>('followers');
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: user, isLoading, isError } = useQuery({
    queryKey: queryKeys.user(viewingUserId ?? ''),
    queryFn: () => getUserProfile(viewingUserId!),
    enabled: !!viewingUserId,
    staleTime: 30_000,
  });

  const messageMutation = useMutation({
    mutationFn: () =>
      createConversation({ type: 'DM', participantId: viewingUserId! }),
    onSuccess: (conv) => {
      setPendingConversation(conv);
      setActiveSection('messages');
    },
    onError: () => toast.error('Could not open conversation'),
  });

  const blockMutation = useMutation({
    mutationFn: () => blockUser(viewingUserId!),
    onSuccess: () => {
      toast.success('User blocked');
      queryClient.invalidateQueries({ queryKey: queryKeys.user(viewingUserId!) });
      setActiveSection(previousSection);
    },
    onError: () => toast.error('Failed to block user'),
  });

  const handleBack = () => setActiveSection(previousSection);

  if (!viewingUserId) {
    handleBack();
    return null;
  }

  if (isLoading) {
    return (
      <div className="max-w-[680px] mx-auto">
        {/* Skeleton header */}
        <div className="bg-surface">
          <div className="h-28 bg-surface-alt animate-pulse" />
          <div className="px-4 pb-4">
            <div className="flex items-end justify-between -mt-12 mb-3">
              <div className="w-20 h-20 rounded-full bg-surface-alt animate-pulse border-4 border-surface" />
              <div className="w-24 h-8 bg-surface-alt animate-pulse rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-surface-alt rounded animate-pulse w-1/3" />
              <div className="h-3 bg-surface-alt rounded animate-pulse w-1/4" />
            </div>
          </div>
        </div>
        <div className="h-px bg-border mt-2" />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="max-w-[680px] mx-auto px-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 py-4 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-semibold text-foreground">Profile not found</p>
          <p className="text-sm text-foreground-muted mt-1">This user may have deleted their account.</p>
        </div>
      </div>
    );
  }

  const actionSlot = (
    <>
      <FollowButton
        userId={user.id}
        isFollowing={user.isFollowing ?? false}
        size="sm"
      />
      <button
        onClick={() => messageMutation.mutate()}
        disabled={messageMutation.isPending}
        className="px-3 py-1 rounded-full border border-border text-xs font-semibold text-foreground-secondary hover:bg-surface-alt transition-colors disabled:opacity-50"
      >
        {messageMutation.isPending ? '…' : 'Message'}
      </button>
      {/* More options */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="p-1.5 rounded-full hover:bg-surface-alt transition-colors"
          aria-label="More options"
        >
          <MoreVertical className="w-4 h-4 text-foreground-secondary" />
        </button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-8 z-50 w-40 bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); blockMutation.mutate(); }}
                disabled={blockMutation.isPending}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-danger hover:bg-danger/5 transition-colors"
              >
                <UserX className="w-4 h-4 flex-shrink-0" />
                Block user
              </button>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-foreground-secondary hover:bg-surface-alt transition-colors"
              >
                <Flag className="w-4 h-4 flex-shrink-0" />
                Report
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="max-w-[680px] mx-auto">
      {/* Back row */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1 bg-surface">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Profile header */}
      <div className="bg-surface">
        <ProfileHeader
          user={user}
          isOwnProfile={user.id === currentUser?.id}
          actionSlot={user.id !== currentUser?.id ? actionSlot : undefined}
          onFollowersClick={() => {
            setFollowersInitialTab('followers');
            setFollowersOpen(true);
          }}
          onFollowingClick={() => {
            setFollowersInitialTab('following');
            setFollowersOpen(true);
          }}
        />
      </div>

      {/* Posts tab header */}
      <div className="sticky top-[var(--top-bar-height,56px)] z-20 bg-surface border-b border-border">
        <div className="flex">
          <div className="flex-1 py-3 text-sm font-semibold text-center text-primary border-b-2 border-primary">
            Posts
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <div className="bg-surface">
        <ProfilePostGrid
          userId={user.id}
          mode="posts"
          onPostClick={(_post: Post) => {
            // TODO: open post detail
          }}
        />
      </div>

      {followersOpen && (
        <FollowersModal
          userId={user.id}
          initialTab={followersInitialTab}
          onClose={() => setFollowersOpen(false)}
          onUserClick={(uid) => {
            setFollowersOpen(false);
            setViewingUser(uid, 'userProfile');
          }}
        />
      )}
    </div>
  );
}
