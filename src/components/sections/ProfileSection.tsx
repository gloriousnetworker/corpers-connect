'use client';

import { useState } from 'react';
import { LogOut, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from '@/lib/query-keys';
import { getMe } from '@/lib/api/users';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfilePostGrid from '@/components/profile/ProfilePostGrid';
import EditProfileModal from '@/components/profile/EditProfileModal';
import FollowersModal from '@/components/profile/FollowersModal';
import { useUIStore } from '@/store/ui.store';
import type { Post } from '@/types/models';

type Tab = 'posts' | 'bookmarks';

export default function ProfileSection() {
  const authUser = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setViewingUser = useUIStore((s) => s.setViewingUser);

  const [tab, setTab] = useState<Tab>('posts');
  const [editOpen, setEditOpen] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followersInitialTab, setFollowersInitialTab] = useState<'followers' | 'following'>('followers');

  // Keep profile data fresh from server (but initialise from authStore immediately)
  const { data: user } = useQuery({
    queryKey: queryKeys.me(),
    queryFn: getMe,
    initialData: authUser ?? undefined,
    staleTime: 30_000,
  });

  if (!user) return null;

  const handlePostClick = (_post: Post) => {
    // TODO: open post detail when Phase 4 post-view is built
  };

  const openFollowers = () => {
    setFollowersInitialTab('followers');
    setFollowersOpen(true);
  };

  const openFollowing = () => {
    setFollowersInitialTab('following');
    setFollowersOpen(true);
  };

  return (
    <div className="max-w-[680px] mx-auto">
      {/* Profile card — no side padding so header bleeds edge-to-edge */}
      <div className="bg-surface mb-0.5">
        <ProfileHeader
          user={user}
          isOwnProfile
          onEditClick={() => setEditOpen(true)}
          onFollowersClick={openFollowers}
          onFollowingClick={openFollowing}
        />
      </div>

      {/* Tab bar */}
      <div className="sticky top-[var(--top-bar-height,56px)] z-20 bg-surface border-b border-border flex">
        {(['posts', 'bookmarks'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors border-b-2 ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground-muted hover:text-foreground'
            }`}
          >
            {t === 'posts' ? 'Posts' : 'Saved'}
          </button>
        ))}
      </div>

      {/* Post grid */}
      <div className="bg-surface">
        <ProfilePostGrid
          userId={user.id}
          mode={tab === 'bookmarks' ? 'bookmarks' : 'posts'}
          onPostClick={handlePostClick}
        />
      </div>

      {/* Settings & sign out */}
      <div className="mt-2 bg-surface border-t border-b border-border divide-y divide-border/60">
        <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface-alt transition-colors text-left">
          <Settings className="w-4 h-4 text-foreground-secondary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">Account Settings</span>
        </button>
        <button
          onClick={clearAuth}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-danger/5 transition-colors text-left"
        >
          <LogOut className="w-4 h-4 text-danger flex-shrink-0" />
          <span className="text-sm font-medium text-danger">Sign Out</span>
        </button>
      </div>

      {/* Modals */}
      {editOpen && <EditProfileModal onClose={() => setEditOpen(false)} />}
      {followersOpen && (
        <FollowersModal
          userId={user.id}
          initialTab={followersInitialTab}
          onClose={() => setFollowersOpen(false)}
          onUserClick={(uid) => {
            setFollowersOpen(false);
            setViewingUser(uid, 'profile');
          }}
        />
      )}
    </div>
  );
}
