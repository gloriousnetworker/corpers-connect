'use client';

import Image from 'next/image';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getUserPosts, getBookmarks } from '@/lib/api/posts';
import { queryKeys } from '@/lib/query-keys';
import { ImageIcon, BookmarkIcon, MessageCircle, Film } from 'lucide-react';
import type { Post } from '@/types/models';

interface ProfilePostGridProps {
  userId: string;
  mode?: 'posts' | 'reels' | 'bookmarks';
  onPostClick?: (post: Post) => void;
}

export default function ProfilePostGrid({ userId, mode = 'posts', onPostClick }: ProfilePostGridProps) {
  const postsQuery = useInfiniteQuery({
    queryKey:
      mode === 'bookmarks'
        ? queryKeys.bookmarks()
        : mode === 'reels'
        ? [...queryKeys.userPosts(userId), 'reels']
        : queryKeys.userPosts(userId),
    queryFn: ({ pageParam }) =>
      mode === 'bookmarks'
        ? getBookmarks({ cursor: pageParam as string | undefined })
        : getUserPosts(userId, {
            cursor: pageParam as string | undefined,
            postType: mode === 'reels' ? 'REEL' : undefined,
          }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 60_000,
  });

  const posts = postsQuery.data?.pages.flatMap((p) => p.items) ?? [];

  if (postsQuery.isLoading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="aspect-square bg-surface-alt animate-pulse" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-14 h-14 rounded-full bg-surface-alt flex items-center justify-center mb-3">
          {mode === 'bookmarks' ? (
            <BookmarkIcon className="w-6 h-6 text-foreground-muted" />
          ) : mode === 'reels' ? (
            <Film className="w-6 h-6 text-foreground-muted" />
          ) : (
            <ImageIcon className="w-6 h-6 text-foreground-muted" />
          )}
        </div>
        <p className="font-semibold text-foreground text-sm">
          {mode === 'bookmarks' ? 'No saved posts' : mode === 'reels' ? 'No reels yet' : 'No posts yet'}
        </p>
        <p className="text-xs text-foreground-muted mt-1">
          {mode === 'bookmarks'
            ? 'Bookmarked posts appear here'
            : mode === 'reels'
            ? 'Reels will appear here'
            : 'Posts will appear here'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map((post) => {
          const firstMedia = post.mediaUrls?.[0];
          return (
            <button
              key={post.id}
              onClick={() => onPostClick?.(post)}
              className="aspect-square relative bg-surface-alt overflow-hidden group"
            >
              {firstMedia ? (
                <Image
                  src={firstMedia}
                  alt="Post"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                  sizes="33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface-alt p-2">
                  <p className="text-xs text-foreground-muted text-center line-clamp-4 leading-relaxed">
                    {post.content}
                  </p>
                </div>
              )}
              {/* Multi-image indicator */}
              {(post.mediaUrls?.length ?? 0) > 1 && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center">
                  <ImageIcon className="w-3.5 h-3.5 text-white drop-shadow" />
                </div>
              )}
              {/* Hover overlay with stats */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <span className="flex items-center gap-1 text-white text-xs font-semibold">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {post.commentsCount ?? 0}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {postsQuery.hasNextPage && (
        <div className="p-4 text-center">
          <button
            onClick={() => postsQuery.fetchNextPage()}
            disabled={postsQuery.isFetchingNextPage}
            className="text-sm text-primary font-semibold disabled:opacity-50"
          >
            {postsQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
