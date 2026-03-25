'use client';

import Image from 'next/image';
import { Plus } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { User } from '@/types/models';

interface StoryRingProps {
  /** The user whose story this represents */
  author: Pick<User, 'firstName' | 'lastName' | 'profilePicture'>;
  /** Whether there are unseen stories in this group */
  hasUnviewed?: boolean;
  /** Whether all stories have been viewed */
  allViewed?: boolean;
  /** Show a + badge (for the current user's "Add Story" ring) */
  isAddButton?: boolean;
  /** Label shown below the avatar */
  label?: string;
  /** Click handler */
  onClick?: () => void;
  /** Size: sm = 56px, md = 64px (default) */
  size?: 'sm' | 'md';
}

export default function StoryRing({
  author,
  hasUnviewed = false,
  allViewed = false,
  isAddButton = false,
  label,
  onClick,
  size = 'md',
}: StoryRingProps) {
  const initials = getInitials(author.firstName, author.lastName);
  const dim = size === 'sm' ? 'w-14 h-14' : 'w-16 h-16';
  const innerDim = size === 'sm' ? 'w-[50px] h-[50px]' : 'w-[58px] h-[58px]';
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';

  // Ring gradient: green = has unviewed, gray = all viewed, none = add button
  const ringClass = isAddButton
    ? 'bg-border'
    : hasUnviewed && !allViewed
    ? 'bg-gradient-to-tr from-primary to-emerald-400'
    : 'bg-border';

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-shrink-0 select-none"
      aria-label={label ?? `${author.firstName}'s story`}
    >
      {/* Ring wrapper */}
      <div className={`relative ${dim} rounded-full p-0.5 ${ringClass}`}>
        {/* White separator between ring and avatar */}
        <div className="w-full h-full rounded-full bg-background p-0.5">
          <div className={`relative ${innerDim} rounded-full overflow-hidden bg-surface-alt`}>
            {author.profilePicture ? (
              <Image
                src={author.profilePicture}
                alt={initials}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <span className={`font-bold text-primary uppercase ${textSize}`}>{initials}</span>
              </div>
            )}
          </div>
        </div>

        {/* + badge for "Add Story" */}
        {isAddButton && (
          <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
            <Plus className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Label */}
      {label && (
        <span className="text-[11px] text-foreground-secondary text-center max-w-[64px] truncate leading-tight">
          {label}
        </span>
      )}
    </button>
  );
}
