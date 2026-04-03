'use client';

import { Image as ImageIcon, Smile, PenSquare } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import Image from 'next/image';
import InfiniteFeed from '@/components/feed/InfiniteFeed';
import dynamic from 'next/dynamic';
const CreatePostModal = dynamic(() => import('@/components/post/CreatePostModal'), { ssr: false });
import StoryTray from '@/components/stories/StoryTray';

export default function FeedSection() {
  const user = useAuthStore((s) => s.user);
  const setCreatePostOpen = useUIStore((s) => s.setCreatePostOpen);

  const initials = user ? getInitials(user.firstName, user.lastName) : 'C';

  return (
    <div className="max-w-[680px] mx-auto px-4 space-y-4">
      {/* Stories tray */}
      <div className="bg-surface rounded-2xl border border-border shadow-card p-4">
        <StoryTray />
      </div>

      {/* Create post card */}
      <div className="bg-surface rounded-2xl border border-border shadow-card p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user?.profilePicture ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <Image src={getAvatarUrl(user.profilePicture, 80)} alt={initials} fill className="object-cover" sizes="40px" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary uppercase">{initials}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCreatePostOpen(true)}
            className="flex-1 text-left px-4 py-2.5 bg-surface-alt rounded-full text-sm text-foreground-muted hover:bg-border/60 transition-colors"
          >
            What&apos;s on your mind, {user?.firstName ?? 'Corper'}?
          </button>
        </div>

        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
          <button
            onClick={() => setCreatePostOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 py-2 rounded-xl hover:bg-surface-alt transition-colors text-sm font-medium text-foreground-secondary"
          >
            <ImageIcon className="w-4 h-4 text-info" />
            <span>Photo</span>
          </button>
          <button
            onClick={() => setCreatePostOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 py-2 rounded-xl hover:bg-surface-alt transition-colors text-sm font-medium text-foreground-secondary"
          >
            <Smile className="w-4 h-4 text-warning" />
            <span>Feeling</span>
          </button>
          <button
            onClick={() => setCreatePostOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 py-2 rounded-xl hover:bg-surface-alt transition-colors text-sm font-medium text-foreground-secondary"
          >
            <PenSquare className="w-4 h-4 text-primary" />
            <span>Write</span>
          </button>
        </div>
      </div>

      {/* Live feed */}
      <InfiniteFeed />

      {/* Create post modal — driven by Zustand state */}
      <CreatePostModal />
    </div>
  );
}
