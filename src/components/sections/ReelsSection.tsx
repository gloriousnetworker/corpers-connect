'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Film, Heart, MessageCircle, Share2, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { getReels } from '@/lib/api/reels';
import { reactToPost, removeReaction } from '@/lib/api/posts';
import { queryKeys } from '@/lib/query-keys';
import { getInitials, getAvatarUrl, formatCount } from '@/lib/utils';
import type { Post } from '@/types/models';
import type { ReactionType } from '@/types/enums';

export default function ReelsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery({
      queryKey: queryKeys.reels(),
      queryFn: ({ pageParam }) => getReels({ cursor: pageParam as string | undefined }),
      getNextPageParam: (last) => (last.hasMore ? (last.nextCursor ?? undefined) : undefined),
      initialPageParam: undefined as string | undefined,
      staleTime: 60_000,
    });

  const reels = data?.pages.flatMap((p) => p.items) ?? [];

  // Intersection observer for infinite scroll trigger
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Track which reel is visible using IntersectionObserver on each card
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActiveIndex(idx);
          }
        }
      },
      { threshold: 0.6 }
    );
    cardRefs.current.forEach((el) => el && observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, [reels.length]);

  const setCardRef = useCallback(
    (el: HTMLDivElement | null, idx: number) => {
      cardRefs.current[idx] = el;
      if (el && observerRef.current) observerRef.current.observe(el);
    },
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <Film className="w-10 h-10 text-foreground-muted" />
          <p className="text-sm text-foreground-muted">Loading reels…</p>
        </div>
      </div>
    );
  }

  if (isError || reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Film className="w-7 h-7 text-primary" />
        </div>
        <p className="font-semibold text-foreground">No reels yet</p>
        <p className="text-sm text-foreground-muted">Be the first to share a reel!</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col" style={{ height: 'calc(100dvh - var(--top-bar-height) - var(--bottom-nav-height))' }}>
      {/* Reels header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center pt-3 pb-2 pointer-events-none">
        <span className="text-white text-lg font-bold drop-shadow-md tracking-wide">Reels</span>
      </div>
    <div
      ref={containerRef}
      className="flex flex-col overflow-y-auto snap-y snap-mandatory scrollbar-none flex-1"
      style={{ height: '100%' }}
    >
      {reels.map((reel, idx) => (
        <ReelCard
          key={reel.id}
          reel={reel}
          isActive={idx === activeIndex}
          muted={muted}
          onMuteToggle={() => setMuted((m) => !m)}
          ref={(el) => setCardRef(el, idx)}
        />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="h-4 flex-shrink-0" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Film className="w-5 h-5 text-primary animate-pulse" />
        </div>
      )}
    </div>
    </div>
  );
}

// ── ReelCard ──────────────────────────────────────────────────────────────────

interface ReelCardProps {
  reel: Post;
  isActive: boolean;
  muted: boolean;
  onMuteToggle: () => void;
  ref: (el: HTMLDivElement | null) => void;
}

import { forwardRef } from 'react';

const ReelCard = forwardRef<HTMLDivElement, Omit<ReelCardProps, 'ref'>>(
  ({ reel: initialReel, isActive, muted, onMuteToggle }, ref) => {
    const [reel, setReel] = useState<Post>(initialReel);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const firstMedia = reel.mediaUrls?.[0];
    const isVideo = firstMedia?.match(/\.(mp4|webm|mov|ogg)$/i);
    const initials = getInitials(reel.author.firstName, reel.author.lastName);
    const queryClient = useQueryClient();

    const reactionMut = useMutation({
      mutationFn: async () => {
        if (reel.myReaction === 'LOVE') {
          await removeReaction(reel.id);
        } else {
          await reactToPost(reel.id, 'LOVE' as ReactionType);
        }
      },
      onMutate: () => {
        const removing = reel.myReaction === 'LOVE';
        setReel((prev) => ({
          ...prev,
          myReaction: removing ? null : ('LOVE' as ReactionType),
          reactionsCount: removing ? Math.max(0, prev.reactionsCount - 1) : prev.reactionsCount + 1,
        }));
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.reels() });
      },
    });

    // Auto-play/pause based on visibility
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      if (isActive) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }, [isActive]);

    // Sync mute state
    useEffect(() => {
      if (videoRef.current) videoRef.current.muted = muted;
    }, [muted]);

    return (
      <div
        ref={ref}
        className="relative flex-shrink-0 snap-start snap-always overflow-hidden bg-black"
        style={{ height: 'calc(100dvh - var(--top-bar-height) - var(--bottom-nav-height))' }}
      >
        {/* Media */}
        {firstMedia ? (
          isVideo ? (
            <video
              ref={videoRef}
              src={firstMedia}
              loop
              playsInline
              muted={muted}
              // Active reel: preload metadata so first frame shows immediately.
              // Inactive reels: preload nothing to avoid wasting bandwidth.
              preload={isActive ? 'metadata' : 'none'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Image
              src={firstMedia}
              alt="Reel"
              fill
              className="object-cover"
              sizes="100vw"
              priority={isActive}
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-alt p-6">
            <p className="text-sm text-foreground text-center">{reel.content}</p>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 pointer-events-none" />

        {/* Author info */}
        <div className="absolute bottom-0 left-0 right-14 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-white/50 flex-shrink-0">
              {reel.author.profilePicture ? (
                <Image
                  src={getAvatarUrl(reel.author.profilePicture, 72)}
                  alt={initials}
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-xs font-bold text-primary uppercase">{initials}</span>
              )}
            </div>
            <span className="text-white text-sm font-semibold drop-shadow">
              {reel.author.firstName} {reel.author.lastName}
            </span>
          </div>
          {reel.content && (
            <p className="text-white/90 text-sm line-clamp-2 drop-shadow">{reel.content}</p>
          )}
        </div>

        {/* Actions sidebar */}
        <div className="absolute bottom-4 right-3 flex flex-col items-center gap-5">
          <button
            onClick={() => reactionMut.mutate()}
            className="flex flex-col items-center gap-1"
          >
            <Heart
              className={`w-7 h-7 drop-shadow transition-colors ${
                reel.myReaction === 'LOVE' ? 'text-red-500 fill-red-500' : 'text-white'
              }`}
            />
            <span className="text-white text-xs font-semibold drop-shadow">
              {reel.reactionsCount > 0 ? formatCount(reel.reactionsCount) : ''}
            </span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <MessageCircle className="w-7 h-7 text-white drop-shadow" />
            <span className="text-white text-xs font-semibold drop-shadow">{reel.commentsCount}</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <Share2 className="w-7 h-7 text-white drop-shadow" />
            <span className="text-white text-xs font-semibold drop-shadow">{reel.sharesCount}</span>
          </button>
          <button onClick={onMuteToggle}>
            {muted ? (
              <VolumeX className="w-6 h-6 text-white drop-shadow" />
            ) : (
              <Volume2 className="w-6 h-6 text-white drop-shadow" />
            )}
          </button>
        </div>
      </div>
    );
  }
);
ReelCard.displayName = 'ReelCard';
