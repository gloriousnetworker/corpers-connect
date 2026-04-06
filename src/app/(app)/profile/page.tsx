'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/lib/api/users';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileHighlights from '@/components/profile/ProfileHighlights';
import ProfilePostGrid from '@/components/profile/ProfilePostGrid';
import EditProfileModal from '@/components/profile/EditProfileModal';
import FollowersModal from '@/components/profile/FollowersModal';

type Tab = 'posts' | 'bookmarks';
type FollowModal = { open: boolean; initialTab: 'followers' | 'following' };

export default function MyProfilePage() {
  const router = useRouter();
  const storeUser = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [editOpen, setEditOpen] = useState(false);
  const [followModal, setFollowModal] = useState<FollowModal>({ open: false, initialTab: 'followers' });

  const { data: user, isLoading } = useQuery({
    queryKey: queryKeys.me(),
    queryFn: getMe,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    placeholderData: storeUser ?? undefined,
    refetchOnMount: 'always',
  });

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-28 bg-surface-alt animate-pulse" />
        <div className="px-4 pb-4 bg-surface">
          <div className="flex justify-between -mt-12 mb-3">
            <div className="w-20 h-20 rounded-full bg-surface-alt animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-36 bg-surface-alt rounded animate-pulse" />
            <div className="h-3 w-24 bg-surface-alt rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <ProfileHeader
        user={user}
        isOwnProfile
        onEditClick={() => setEditOpen(true)}
        onFollowersClick={() => setFollowModal({ open: true, initialTab: 'followers' })}
        onFollowingClick={() => setFollowModal({ open: true, initialTab: 'following' })}
      />

      <ProfileHighlights user={user} />

      {/* Tabs */}
      <div className="flex border-b border-border bg-surface sticky top-0 z-10">
        <TabButton label="Posts" active={activeTab === 'posts'} onClick={() => setActiveTab('posts')} />
        <TabButton label="Saved" active={activeTab === 'bookmarks'} onClick={() => setActiveTab('bookmarks')} />
      </div>

      <ProfilePostGrid
        userId={user.id}
        mode={activeTab === 'bookmarks' ? 'bookmarks' : 'posts'}
        onPostClick={(post) => router.push(`/post/${post.id}`)}
      />

      {editOpen && <EditProfileModal onClose={() => setEditOpen(false)} />}

      {followModal.open && (
        <FollowersModal
          userId={user.id}
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

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
        active ? 'border-primary text-primary' : 'border-transparent text-foreground-muted'
      }`}
    >
      {label}
    </button>
  );
}
