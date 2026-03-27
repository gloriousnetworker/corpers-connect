'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getUserHighlights } from '@/lib/api/stories';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import StoryViewer from '@/components/stories/StoryViewer';
import type { User, StoryGroup } from '@/types/models';

interface ProfileHighlightsProps {
  user: User;
}

export default function ProfileHighlights({ user }: ProfileHighlightsProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [viewerOpen, setViewerOpen] = useState(false);

  const { data: highlights = [], isLoading } = useQuery({
    queryKey: queryKeys.userHighlights(user.id),
    queryFn: () => getUserHighlights(user.id),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex gap-4 px-4 py-3 overflow-x-auto scrollbar-none border-b border-border">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5">
            <div className="w-16 h-16 rounded-full bg-surface-alt animate-pulse" />
            <div className="h-2 w-12 bg-surface-alt rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (highlights.length === 0) return null;

  // Build a synthetic StoryGroup to pass to StoryViewer
  const group: StoryGroup = {
    author: user,
    stories: highlights,
    hasUnviewed: highlights.some((s) => !s.isViewed),
  };

  return (
    <>
      <div className="flex gap-4 px-4 py-3 overflow-x-auto scrollbar-none border-b border-border">
        {highlights.map((story) => {
          const isVideo = story.mediaType?.startsWith('video') || story.mediaUrl?.match(/\.(mp4|webm|mov|ogg)$/i);
          return (
            <button
              key={story.id}
              onClick={() => setViewerOpen(true)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5"
            >
              <div
                className={`w-16 h-16 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-surface ${
                  !story.isViewed ? 'ring-primary' : 'ring-border'
                }`}
              >
                {isVideo ? (
                  <div className="w-full h-full bg-surface-alt flex items-center justify-center">
                    <Play className="w-5 h-5 text-foreground-muted fill-foreground-muted" />
                  </div>
                ) : (
                  <Image
                    src={story.mediaUrl}
                    alt="Highlight"
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                )}
              </div>
              <span className="text-[10px] text-foreground-muted w-16 text-center truncate leading-tight">
                Highlight
              </span>
            </button>
          );
        })}
      </div>

      {viewerOpen && (
        <StoryViewer
          groups={[group]}
          initialGroupIndex={0}
          currentUserId={currentUser?.id ?? ''}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
