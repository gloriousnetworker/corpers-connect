'use client';

import Image from 'next/image';
import { BadgeCheck } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import LevelBadge from './LevelBadge';
import FollowButton from './FollowButton';
import type { User } from '@/types/models';

interface UserCardProps {
  user: Pick<User,
    'id' | 'firstName' | 'lastName' | 'profilePicture' |
    'level' | 'isVerified' | 'servingState' | 'isFollowing'
  >;
  /** Show the follow button (false for own-profile lists) */
  showFollow?: boolean;
  onClick?: () => void;
}

export default function UserCard({ user, showFollow = true, onClick }: UserCardProps) {
  const initials = getInitials(user.firstName, user.lastName);

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <button
        onClick={onClick}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <div className="w-11 h-11 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
          {user.profilePicture ? (
            <Image
              src={user.profilePicture}
              alt={initials}
              width={44}
              height={44}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="font-bold text-primary text-sm uppercase">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {user.firstName} {user.lastName}
            </p>
            {user.isVerified && (
              <BadgeCheck className="w-3.5 h-3.5 text-info flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <LevelBadge level={user.level} size="sm" />
            <span className="text-xs text-foreground-muted truncate">{user.servingState}</span>
          </div>
        </div>
      </button>
      {showFollow && (
        <FollowButton
          userId={user.id}
          isFollowing={user.isFollowing ?? false}
          size="sm"
        />
      )}
    </div>
  );
}
