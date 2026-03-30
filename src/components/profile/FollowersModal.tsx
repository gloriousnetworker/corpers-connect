'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getFollowers, getFollowing } from '@/lib/api/users';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import ClientPortal from '@/components/ui/ClientPortal';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import FollowButton from './FollowButton';
import LevelBadge from './LevelBadge';
import type { User } from '@/types/models';

interface FollowersModalProps {
  userId: string;
  initialTab?: 'followers' | 'following';
  onClose: () => void;
  onUserClick?: (userId: string) => void;
}

export default function FollowersModal({
  userId,
  initialTab = 'followers',
  onClose,
  onUserClick,
}: FollowersModalProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<'followers' | 'following'>(initialTab);
  useBodyScrollLock(true);

  const followersQuery = useInfiniteQuery({
    queryKey: queryKeys.userFollowers(userId),
    queryFn: ({ pageParam }) => getFollowers(userId, pageParam as string | undefined),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    enabled: tab === 'followers',
  });

  const followingQuery = useInfiniteQuery({
    queryKey: queryKeys.userFollowing(userId),
    queryFn: ({ pageParam }) => getFollowing(userId, pageParam as string | undefined),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    enabled: tab === 'following',
  });

  const activeQuery = tab === 'followers' ? followersQuery : followingQuery;
  const users: User[] = activeQuery.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div
          className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
          style={{ maxHeight: '80dvh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <div className="flex gap-4">
              <button
                onClick={() => setTab('followers')}
                className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
                  tab === 'followers' ? 'border-primary text-primary' : 'border-transparent text-foreground-muted'
                }`}
              >
                Followers
              </button>
              <button
                onClick={() => setTab('following')}
                className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
                  tab === 'following' ? 'border-primary text-primary' : 'border-transparent text-foreground-muted'
                }`}
              >
                Following
              </button>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-alt transition-colors">
              <X className="w-4 h-4 text-foreground-secondary" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {activeQuery.isLoading ? (
              <div className="space-y-0">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-surface-alt animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-surface-alt rounded animate-pulse w-1/3" />
                      <div className="h-2.5 bg-surface-alt rounded animate-pulse w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-10 text-sm text-foreground-muted">
                {tab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </div>
            ) : (
              users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => onUserClick?.(u.id)}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {u.profilePicture ? (
                        <Image src={getAvatarUrl(u.profilePicture, 80)} alt={getInitials(u.firstName, u.lastName)} width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <span className="font-bold text-primary text-sm uppercase">{getInitials(u.firstName, u.lastName)}</span>
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {u.firstName} {u.lastName}
                      </p>
                      <LevelBadge level={u.level} size="sm" />
                    </div>
                  </button>
                  {currentUser && u.id !== currentUser.id && (
                    <FollowButton
                      userId={u.id}
                      isFollowing={u.isFollowing ?? false}
                      size="sm"
                    />
                  )}
                </div>
              ))
            )}

            {/* Load more */}
            {activeQuery.hasNextPage && (
              <div className="p-3 text-center">
                <button
                  onClick={() => activeQuery.fetchNextPage()}
                  disabled={activeQuery.isFetchingNextPage}
                  className="text-sm text-primary font-semibold disabled:opacity-50"
                >
                  {activeQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientPortal>
  );
}
