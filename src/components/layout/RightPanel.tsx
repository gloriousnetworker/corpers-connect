'use client';

import Image from 'next/image';
import { Users, BadgeCheck, Crown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getSuggestions } from '@/lib/api/discover';
import { queryKeys } from '@/lib/query-keys';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { getInitials } from '@/lib/utils';
import FollowButton from '@/components/profile/FollowButton';

export default function RightPanel() {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const currentUser = useAuthStore((s) => s.user);

  const { data: suggestions, isLoading } = useQuery({
    queryKey: queryKeys.suggestions(),
    queryFn: () => getSuggestions(5),
    staleTime: 5 * 60_000,
  });

  return (
    <div className="space-y-5">
      {/* Suggested Corpers */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Suggested Corpers</h3>
        </div>

        {isLoading ? (
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2.5">
                <div className="w-9 h-9 rounded-full bg-surface-alt animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-surface-alt rounded animate-pulse w-24" />
                  <div className="h-2.5 bg-surface-alt rounded animate-pulse w-16" />
                </div>
                <div className="h-6 w-14 bg-surface-alt rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : (suggestions?.length ?? 0) === 0 ? (
          <p className="text-xs text-foreground-muted py-2">No suggestions right now</p>
        ) : (
          <div className="space-y-0">
            {suggestions!.map((u) => {
              const initials = getInitials(u.firstName, u.lastName);
              return (
                <div key={u.id} className="flex items-center gap-2.5 py-2.5">
                  <button
                    onClick={() => setViewingUser(u.id, 'feed')}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {u.profilePicture ? (
                        <Image
                          src={u.profilePicture}
                          alt={initials}
                          width={36}
                          height={36}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="font-bold text-primary text-xs uppercase">{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {u.firstName} {u.lastName}
                        </p>
                        {u.isVerified && <BadgeCheck className="w-3 h-3 text-info flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-foreground-muted truncate">{u.servingState}</p>
                    </div>
                  </button>
                  {u.id !== currentUser?.id && (
                    <FollowButton
                      userId={u.id}
                      isFollowing={u.isFollowing ?? false}
                      size="sm"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => useUIStore.getState().setActiveSection('discover')}
          className="mt-1 text-xs text-primary font-medium hover:underline"
        >
          See more in Discover
        </button>
      </div>

      {/* State info card */}
      {currentUser?.servingState && (
        <div className="bg-primary/8 rounded-2xl p-4">
          <p className="text-xs font-semibold text-primary mb-0.5">
            Serving in {currentUser.servingState}
          </p>
          <p className="text-xs text-foreground-secondary leading-relaxed">
            Connect with fellow corpers in your state via the Discover tab.
          </p>
        </div>
      )}

      {/* Corper Plus promo — only shown to FREE tier users */}
      {currentUser?.subscriptionTier !== 'PREMIUM' && (
        <div className="bg-gradient-to-br from-amber-50 to-primary/5 rounded-2xl border border-amber-200/60 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-amber-500 flex-shrink-0" />
            <p className="text-xs font-bold text-foreground">Corper Plus</p>
          </div>
          <p className="text-xs text-foreground-secondary leading-relaxed">
            Upgrade for CORPER badge, boosted visibility, and priority ranking.
          </p>
          <button
            onClick={() => useUIStore.getState().setActiveSection('subscriptions')}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Learn more →
          </button>
        </div>
      )}
    </div>
  );
}
