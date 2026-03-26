'use client';

import Image from 'next/image';
import { BadgeCheck } from 'lucide-react';
import { getInitials, formatCount } from '@/lib/utils';
import LevelBadge from './LevelBadge';
import CorperTagBadge from './CorperTagBadge';
import type { User } from '@/types/models';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile?: boolean;
  onEditClick?: () => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  actionSlot?: React.ReactNode; // Follow / Message / Block buttons for other-user view
}

export default function ProfileHeader({
  user,
  isOwnProfile = false,
  onEditClick,
  onFollowersClick,
  onFollowingClick,
  actionSlot,
}: ProfileHeaderProps) {
  const initials = getInitials(user.firstName, user.lastName);

  return (
    <div className="bg-surface">
      {/* Cover gradient */}
      <div className="h-28 bg-gradient-to-br from-primary/60 via-primary/40 to-primary/10" />

      <div className="px-4 pb-4">
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-12 mb-3">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-surface border-4 border-surface flex items-center justify-center flex-shrink-0">
            {user.profilePicture ? (
              <Image
                src={user.profilePicture}
                alt={initials}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="font-bold text-primary text-2xl uppercase">{initials}</span>
            )}
          </div>

          {/* Action button */}
          {isOwnProfile ? (
            <button
              onClick={onEditClick}
              className="relative z-10 px-4 py-1.5 rounded-full border border-border bg-surface text-sm font-semibold text-foreground hover:bg-surface-alt transition-colors"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">{actionSlot}</div>
          )}
        </div>

        {/* Name + badges */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-foreground leading-tight">
              {user.firstName} {user.lastName}
            </h1>
            {user.isVerified && (
              <BadgeCheck className="w-4 h-4 text-info flex-shrink-0" aria-label="Verified" />
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <LevelBadge level={user.level} size="sm" />
            {user.corperTag && (
              <CorperTagBadge label={user.corperTagLabel} servingState={user.servingState} />
            )}
          </div>

          <p className="text-xs text-foreground-muted">
            {user.stateCode} · Batch {user.batch} · {user.servingState}
          </p>

          {user.bio && (
            <p className="text-sm text-foreground leading-relaxed">{user.bio}</p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex gap-5 mt-4">
          <StatChip label="Posts" value={user.postsCount ?? 0} />
          <button onClick={onFollowersClick} className="text-left">
            <StatChip label="Followers" value={user.followersCount ?? 0} clickable />
          </button>
          <button onClick={onFollowingClick} className="text-left">
            <StatChip label="Following" value={user.followingCount ?? 0} clickable />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, value, clickable }: { label: string; value: number; clickable?: boolean }) {
  return (
    <div className={clickable ? 'hover:opacity-70 transition-opacity' : ''}>
      <p className="text-base font-bold text-foreground leading-none">{formatCount(value)}</p>
      <p className="text-xs text-foreground-muted mt-0.5">{label}</p>
    </div>
  );
}
