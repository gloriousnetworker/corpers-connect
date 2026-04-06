'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { getUserProfile } from '@/lib/api/users';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileHighlights from '@/components/profile/ProfileHighlights';
import ProfilePostGrid from '@/components/profile/ProfilePostGrid';
import FollowButton from '@/components/profile/FollowButton';
import FollowersModal from '@/components/profile/FollowersModal';

type FollowModal = { open: boolean; initialTab: 'followers' | 'following' };

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const [followModal, setFollowModal] = useState<FollowModal>({ open: false, initialTab: 'followers' });
  const isSelf = currentUser?.id === userId;

  // Redirect to own profile if viewing self
  useEffect(() => {
    if (isSelf) router.replace('/profile');
  }, [isSelf, router]);

  const { data: user, isLoading } = useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => getUserProfile(userId),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
    enabled: !isSelf,
  });

  if (isSelf) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-28 bg-surface-alt animate-pulse" />
        <div className="px-4 pb-4 bg-surface">
          <div className="flex justify-between -mt-12 mb-3">
            <div className="w-20 h-20 rounded-full bg-surface-alt animate-pulse" />
            <div className="w-20 h-8 rounded-full bg-surface-alt animate-pulse mt-4" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-36 bg-surface-alt rounded animate-pulse" />
            <div className="h-3 w-24 bg-surface-alt rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground-muted text-sm">User not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <ProfileHeader
        user={user}
        isOwnProfile={false}
        onFollowersClick={() => setFollowModal({ open: true, initialTab: 'followers' })}
        onFollowingClick={() => setFollowModal({ open: true, initialTab: 'following' })}
        actionSlot={
          <>
            <FollowButton userId={userId} isFollowing={user.isFollowing ?? false} followsYou={user.followsYou ?? false} />
            <button
              onClick={() => router.push(`/messages?userId=${userId}`)}
              className="p-2 rounded-full border border-border bg-surface text-foreground hover:bg-surface-alt transition-colors"
              aria-label="Message"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </>
        }
      />

      <ProfileHighlights user={user} />

      {/* Tab header — posts only for other users (no bookmarks) */}
      <div className="flex border-b border-border bg-surface sticky top-0 z-10">
        <div className="flex-1 py-2.5 text-sm font-semibold border-b-2 border-primary text-primary text-center">
          Posts
        </div>
      </div>

      <ProfilePostGrid
        userId={userId}
        mode="posts"
        onPostClick={(post) => router.push(`/post/${post.id}`)}
      />

      {followModal.open && (
        <FollowersModal
          userId={userId}
          initialTab={followModal.initialTab}
          onClose={() => setFollowModal((m) => ({ ...m, open: false }))}
          onUserClick={(uid) => {
            setFollowModal((m) => ({ ...m, open: false }));
            router.push(`/profile/${uid}`);
          }}
        />
      )}
    </div>
  );
}
