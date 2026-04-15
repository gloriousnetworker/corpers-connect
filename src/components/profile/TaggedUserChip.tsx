'use client';

import Image from 'next/image';
import { X, BadgeCheck } from 'lucide-react';
import { getAvatarUrl, getInitials } from '@/lib/utils';
import type { TaggedUserSummary } from '@/types/models';

interface TaggedUserChipProps {
  user: TaggedUserSummary;
  onRemove?: () => void;
}

/**
 * Inline "with {person}" chip shown in post composer, camp-day editor, and
 * anywhere tagged users appear. Green pill with avatar, name, verified tick,
 * and an optional close button.
 */
export default function TaggedUserChip({ user, onRemove }: TaggedUserChipProps) {
  return (
    <div className="group inline-flex items-center gap-1.5 pl-0.5 pr-2 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold shadow-[0_1px_0_0_rgba(0,0,0,0.02)]">
      {user.profilePicture ? (
        <Image
          src={getAvatarUrl(user.profilePicture, 48)}
          alt=""
          width={22}
          height={22}
          className="w-[22px] h-[22px] rounded-full object-cover flex-shrink-0 ring-2 ring-white dark:ring-surface"
        />
      ) : (
        <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center flex-shrink-0 ring-2 ring-white dark:ring-surface">
          <span className="text-[9px] font-black text-white uppercase leading-none">
            {getInitials(user.firstName, user.lastName)}
          </span>
        </div>
      )}
      <span className="leading-none">{user.firstName}</span>
      {user.isVerified && (
        <BadgeCheck className="w-3 h-3 text-primary fill-primary/20 flex-shrink-0" />
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 p-0.5 rounded-full text-primary/60 hover:text-primary hover:bg-primary/15 transition-colors"
          aria-label={`Remove ${user.firstName}`}
        >
          <X className="w-3 h-3" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
