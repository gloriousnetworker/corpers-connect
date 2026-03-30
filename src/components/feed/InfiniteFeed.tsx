'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, ArrowUp } from 'lucide-react';
import { getFeed } from '@/lib/api/feed';
import { queryKeys } from '@/lib/query-keys';
import PostCard from '@/components/post/PostCard';
import PostCardSkeleton from '@/components/post/PostCardSkeleton';
import CreatePostModal from '@/components/post/CreatePostModal';
import type { Post } from '@/types/models';

const PULL_THRESHOLD = 64; // px to trigger refresh

export default function InfiniteFeed() {
  const [editPost, setEditPost] = useState<Post | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Pull-to-refresh state
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  // "New posts available" banner
  const [showNewBanner, setShowNewBanner] = useState(false);
  const firstPostIdRef = useRef<string | null>(null);

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
      getFeed({
        cursor: pageParam as string | undefined,
        // Fetch only 10 posts on the first page so the feed paints faster.
        // Subsequent pages load 20 to reduce round trips while scrolling.
        limit: pageParam ? 20 : 10,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.hasMore ? (last.nextCursor ?? undefined) : undefined,
    staleTime: 1000 * 60 * 3,       // 3 min — less aggressive than before
    refetchInterval: 1000 * 60 * 5, // background poll every 5 min (was 2 min)
    gcTime: 1000 * 60 * 15,         // keep cached feed in memory for 15 min
  });

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  // Detect new posts via background refetch
  useEffect(() => {
    const firstPost = data?.pages[0]?.items[0];
    if (!firstPost) return;
    if (firstPostIdRef.current === null) {
      firstPostIdRef.current = firstPost.id;
      return;
    }
    if (firstPost.id !== firstPostIdRef.current) {
      setShowNewBanner(true);
      firstPostIdRef.current = firstPost.id;
    }
  }, [data]);

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      // Apply rubber-band resistance so the pull feels natural
      setPullY(Math.min(delta * 0.45, PULL_THRESHOLD * 1.5));
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullY >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullY(0);
      await refetch();
      setIsRefreshing(false);
    } else {
      setPullY(0);
    }
  }, [pullY, isRefreshing, refetch]);

  const handleBannerClick = useCallback(() => {
    setShowNewBanner(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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

  const showPullIndicator = pullY > 8 || isRefreshing;
  const pullTriggered = pullY >= PULL_THRESHOLD;

  return (
    <>
      {/* New posts available banner */}
      {showNewBanner && (
        <button
          onClick={handleBannerClick}
          className="fixed top-[calc(var(--top-bar-height,56px)+8px)] left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold shadow-lg active:scale-95 transition-transform"
          aria-label="New posts available"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          New posts available
        </button>
      )}

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: pullY > 0 ? `translateY(${pullY}px)` : undefined, transition: pullY === 0 ? 'transform 0.2s ease' : undefined }}
      >
        {/* Pull-to-refresh indicator */}
        {showPullIndicator && (
          <div className="flex justify-center items-center py-3 -mt-10 mb-1">
            <Loader2
              className={`w-5 h-5 text-primary transition-transform ${
                isRefreshing || pullTriggered ? 'animate-spin' : ''
              }`}
              style={!isRefreshing ? { transform: `rotate(${(pullY / PULL_THRESHOLD) * 360}deg)` } : undefined}
            />
          </div>
        )}

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
