'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, Crown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from '@/lib/query-keys';
import { getMe } from '@/lib/api/users';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfilePostGrid from '@/components/profile/ProfilePostGrid';
import ProfileHighlights from '@/components/profile/ProfileHighlights';
import EditProfileModal from '@/components/profile/EditProfileModal';
import FollowersModal from '@/components/profile/FollowersModal';
import { useUIStore } from '@/store/ui.store';
import type { Post } from '@/types/models';

type Tab = 'posts' | 'reels' | 'highlights' | 'bookmarks';

export default function ProfileSection() {
  const authUser = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const setActiveSection = useUIStore((s) => s.setActiveSection);
  const router = useRouter();

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
        {(['posts', 'reels', 'highlights', 'bookmarks'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-semibold capitalize transition-colors border-b-2 ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground-muted hover:text-foreground'
            }`}
          >
            {t === 'bookmarks' ? 'Saved' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-surface">
        {tab === 'highlights' ? (
          <ProfileHighlights user={user} />
        ) : (
          <ProfilePostGrid
            userId={user.id}
            mode={tab === 'bookmarks' ? 'bookmarks' : tab === 'reels' ? 'reels' : 'posts'}
            onPostClick={handlePostClick}
          />
        )}
      </div>

      {/* Settings & sign out */}
      <div className="mt-2 bg-surface border-t border-b border-border divide-y divide-border/60">
        {/* Corper Plus upgrade / manage */}
        <button
          onClick={() => setActiveSection('subscriptions')}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface-alt transition-colors text-left"
        >
          <Crown
            className={`w-4 h-4 flex-shrink-0 ${user.subscriptionTier === 'PREMIUM' ? 'text-primary' : 'text-amber-500'}`}
          />
          <span className="text-sm font-medium text-foreground">
            {user.subscriptionTier === 'PREMIUM' ? 'Manage Subscription' : 'Upgrade to Corper Plus'}
          </span>
          {user.subscriptionTier !== 'PREMIUM' && (
            <span className="ml-auto text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              ₦1,500/mo
            </span>
          )}
        </button>
        <button
          onClick={() => router.push('/settings')}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface-alt transition-colors text-left"
        >
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
