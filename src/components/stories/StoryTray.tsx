'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStories } from '@/lib/api/stories';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { getInitials } from '@/lib/utils';
import StoryRing from './StoryRing';
import StoryViewer from './StoryViewer';
import StoryCreator from './StoryCreator';
import type { StoryGroup } from '@/types/models';

export default function StoryTray() {
  const user = useAuthStore((s) => s.user);
  const [viewingGroup, setViewingGroup] = useState<{ groups: StoryGroup[]; index: number } | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);

  const { data: groups = [] } = useQuery({
    queryKey: queryKeys.stories(),
    queryFn: getStories,
    staleTime: 60_000,
  });

  if (!user) return null;

  const initials = getInitials(user.firstName, user.lastName);

  // Find if the current user has their own story group at the front
  const ownGroup = groups.find((g) => g.author.id === user.id);
  const otherGroups = groups.filter((g) => g.author.id !== user.id);

  const handleViewGroup = (groupIndex: number) => {
    setViewingGroup({ groups, index: groupIndex });
  };

  return (
    <>
      {/* Tray */}
      <div
        className="flex items-start gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4"
        aria-label="Stories tray"
      >
        {/* "Add Story" / "Your Story" bubble — always first */}
        {ownGroup ? (
          <StoryRing
            author={ownGroup.author}
            hasUnviewed={ownGroup.hasUnviewed}
            label="Your story"
            onClick={() => {
              const idx = groups.findIndex((g) => g.author.id === user.id);
              if (idx !== -1) handleViewGroup(idx);
            }}
          />
        ) : (
          <StoryRing
            author={{ firstName: user.firstName, lastName: user.lastName, profilePicture: user.profilePicture }}
            isAddButton
            label="Add story"
            onClick={() => setCreatorOpen(true)}
          />
        )}

        {/* Other users' story groups */}
        {otherGroups.map((group) => {
          const idx = groups.findIndex((g) => g.author.id === group.author.id);
          return (
            <StoryRing
              key={group.author.id}
              author={group.author}
              hasUnviewed={group.hasUnviewed}
              allViewed={!group.hasUnviewed}
              label={group.author.firstName}
              onClick={() => handleViewGroup(idx)}
            />
          );
        })}

        {/* If no stories at all, show skeleton placeholders */}
        {groups.length === 0 && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-surface-alt animate-pulse" />
                <div className="w-10 h-2 rounded bg-surface-alt animate-pulse" />
              </div>
            ))}
          </>
        )}
      </div>

      {/* Story viewer */}
      {viewingGroup && (
        <StoryViewer
          groups={viewingGroup.groups}
          initialGroupIndex={viewingGroup.index}
          currentUserId={user.id}
          onClose={() => setViewingGroup(null)}
          onAddStory={() => {
            setViewingGroup(null);
            setCreatorOpen(true);
          }}
        />
      )}

      {/* Story creator */}
      <StoryCreator
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
      />
    </>
  );
}
