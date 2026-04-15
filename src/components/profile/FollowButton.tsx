'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { followUser, unfollowUser } from '@/lib/api/users';
import { queryKeys } from '@/lib/query-keys';
import { useHaptic } from '@/hooks/useHaptic';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  followsYou?: boolean;
  size?: 'sm' | 'md';
  onToggle?: (nowFollowing: boolean) => void;
}

export default function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
  followsYou = false,
  size = 'md',
  onToggle,
}: FollowButtonProps) {
  const queryClient = useQueryClient();
  const haptic = useHaptic();
  // Optimistic local state — avoids waiting for query refetch
  const [following, setFollowing] = useState(initialIsFollowing);

  // Pass the intended action as a variable so mutationFn never closes over stale state.
  // Without this, onMutate's setFollowing() triggers a re-render that updates the
  // mutationFn closure before it runs, causing follow to call unfollowUser and vice-versa.
  const mutation = useMutation({
    mutationFn: (shouldFollow: boolean) =>
      shouldFollow ? followUser(userId) : unfollowUser(userId),
    onMutate: (shouldFollow) => {
      setFollowing(shouldFollow);
      onToggle?.(shouldFollow);
    },
    onSuccess: () => {
      // Invalidate profile counts + all lists that show isFollowing state
      queryClient.invalidateQueries({ queryKey: queryKeys.user(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      queryClient.invalidateQueries({ queryKey: queryKeys.discoverCorpers() });
      queryClient.invalidateQueries({ queryKey: queryKeys.suggestions() });
      // Invalidate followers/following lists so the modal reflects new state immediately
      queryClient.invalidateQueries({ queryKey: queryKeys.userFollowers(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userFollowing(userId) });
    },
    onError: (_err, shouldFollow) => {
      // Revert: we tried shouldFollow, so revert to the opposite
      setFollowing(!shouldFollow);
      onToggle?.(!shouldFollow);
    },
  });

  const sizeClass = size === 'sm'
    ? 'px-3 py-1 text-xs'
    : 'px-4 py-1.5 text-sm';

  if (following) {
    return (
      <button
        onClick={() => { haptic.light(); mutation.mutate(false); }}
        disabled={mutation.isPending}
        className={`${sizeClass} rounded-full border border-border font-semibold text-foreground-secondary hover:bg-error/10 hover:text-error hover:border-error/30 transition-colors disabled:opacity-50`}
      >
        Unfollow
      </button>
    );
  }

  return (
    <button
      onClick={() => { haptic.medium(); mutation.mutate(true); }}
      disabled={mutation.isPending}
      className={`${sizeClass} rounded-full font-semibold transition-all disabled:opacity-50 ${
        followsYou
          ? 'bg-white dark:bg-transparent text-primary border-2 border-primary hover:bg-primary/10 shadow-sm'
          : 'bg-primary text-white hover:bg-primary-dark'
      }`}
    >
      {followsYou ? 'Follow back' : 'Follow'}
    </button>
  );
}
