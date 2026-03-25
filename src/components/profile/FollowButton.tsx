'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { followUser, unfollowUser } from '@/lib/api/users';
import { queryKeys } from '@/lib/query-keys';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  size?: 'sm' | 'md';
  onToggle?: (nowFollowing: boolean) => void;
}

export default function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
  size = 'md',
  onToggle,
}: FollowButtonProps) {
  const queryClient = useQueryClient();
  // Optimistic local state — avoids waiting for query refetch
  const [following, setFollowing] = useState(initialIsFollowing);

  const mutation = useMutation({
    mutationFn: () => (following ? unfollowUser(userId) : followUser(userId)),
    onMutate: () => {
      const next = !following;
      setFollowing(next);
      onToggle?.(next);
    },
    onSuccess: () => {
      // Invalidate profile to update follower/following counts
      queryClient.invalidateQueries({ queryKey: queryKeys.user(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.me() });
    },
    onError: () => {
      // Revert optimistic update
      setFollowing(following);
      onToggle?.(following);
    },
  });

  const sizeClass = size === 'sm'
    ? 'px-3 py-1 text-xs'
    : 'px-4 py-1.5 text-sm';

  if (following) {
    return (
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className={`${sizeClass} rounded-full border border-border font-semibold text-foreground-secondary hover:bg-error/10 hover:text-error hover:border-error/30 transition-colors disabled:opacity-50`}
      >
        Following
      </button>
    );
  }

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={`${sizeClass} rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50`}
    >
      Follow
    </button>
  );
}
