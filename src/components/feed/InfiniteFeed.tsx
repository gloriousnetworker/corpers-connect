'use client';

import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeed } from '@/lib/api/feed';
import { queryKeys } from '@/lib/query-keys';
import PostCard from '@/components/post/PostCard';
import PostCardSkeleton from '@/components/post/PostCardSkeleton';
import CreatePostModal from '@/components/post/CreatePostModal';
import type { Post } from '@/types/models';

export default function InfiniteFeed() {
  const [editPost, setEditPost] = useState<Post | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.feed(),
    queryFn: ({ pageParam }) =>
      getFeed({ cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.hasMore ? (last.nextCursor ?? undefined) : undefined,
    staleTime: 1000 * 60 * 2, // 2 min
  });

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  // Intersection observer for infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-surface rounded-2xl border border-border shadow-card p-10 text-center">
        <p className="text-3xl mb-3">😕</p>
        <p className="font-semibold text-foreground">Failed to load feed</p>
        <p className="text-sm text-foreground-secondary mt-1 mb-4">
          Check your connection and try again
        </p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isLoading && posts.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-border shadow-card p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🏡</span>
        </div>
        <p className="font-semibold text-foreground">Your feed is quiet</p>
        <p className="text-sm text-foreground-secondary mt-1">
          Follow corpers or create the first post!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onEdit={setEditPost}
          />
        ))}

        {/* Sentinel for infinite scroll */}
        <div ref={loadMoreRef} className="h-4" />

        {isFetchingNextPage && (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!hasNextPage && posts.length > 0 && (
          <p className="text-center text-sm text-foreground-muted py-6">
            You&apos;re all caught up 🎉
          </p>
        )}
      </div>

      {/* Edit post modal */}
      {editPost && (
        <CreatePostModal
          editPost={editPost}
          onClose={() => setEditPost(null)}
        />
      )}
    </>
  );
}
