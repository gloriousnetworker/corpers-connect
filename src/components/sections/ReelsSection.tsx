'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Film, Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, UserPlus, Check, Plus } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { getReels } from '@/lib/api/reels';
import { reactToPost, removeReaction, bookmarkPost, unbookmarkPost, sharePost } from '@/lib/api/posts';
import { followUser, unfollowUser } from '@/lib/api/users';
import { queryKeys } from '@/lib/query-keys';
import { useUIStore } from '@/store/ui.store';
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
  const setCreateReelOpen = useUIStore((s) => s.setCreateReelOpen);

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
        <button
          onClick={() => setCreateReelOpen(true)}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Create Reel
        </button>
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

      {/* Floating Create Reel button */}
      <button
        onClick={() => setCreateReelOpen(true)}
        className="absolute bottom-6 right-4 z-30 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-black/40 hover:bg-primary-dark active:scale-95 transition-all flex items-center justify-center"
        aria-label="Create a new reel"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>
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
    const [isFollowing, setIsFollowing] = useState<boolean>(!!initialReel.author.isFollowing);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const firstMedia = reel.mediaUrls?.[0];
    const isVideo = firstMedia?.match(/\.(mp4|webm|mov|ogg)$/i);
    const initials = getInitials(reel.author.firstName, reel.author.lastName);
    const queryClient = useQueryClient();
    const setViewingUser = useUIStore((s) => s.setViewingUser);

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

    const bookmarkMut = useMutation({
      mutationFn: () => reel.isBookmarked ? unbookmarkPost(reel.id) : bookmarkPost(reel.id),
      onMutate: () => {
        setReel((prev) => ({ ...prev, isBookmarked: !prev.isBookmarked }));
      },
    });

    const followMut = useMutation({
      mutationFn: () => isFollowing ? unfollowUser(reel.author.id) : followUser(reel.author.id),
      onMutate: () => setIsFollowing((v) => !v),
      onError: () => {
        setIsFollowing((v) => !v);
        toast.error('Failed to update follow');
      },
    });

    const handleShare = async () => {
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Corpers Connect reel',
            text: reel.content?.slice(0, 100) ?? 'Check out this reel',
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(window.location.href);
          toast.success('Link copied!');
        }
        setReel((prev) => ({ ...prev, sharesCount: (prev.sharesCount || 0) + 1 }));
        const result = await sharePost(reel.id);
        setReel((prev) => ({ ...prev, sharesCount: result.sharesCount }));
      } catch { /* cancelled */ }
    };

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

    const liked = reel.myReaction === 'LOVE';
    const isOwn = false; // could check against current user

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

        {/* Author info — bottom-left, with Connect button inline */}
        <div className="absolute bottom-0 left-0 right-20 p-4 z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <button
              onClick={() => setViewingUser(reel.author.id, 'reels')}
              className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-white flex-shrink-0"
              aria-label="View profile"
            >
              {reel.author.profilePicture ? (
                <Image
                  src={getAvatarUrl(reel.author.profilePicture, 80)}
                  alt={initials}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-xs font-bold text-primary uppercase">{initials}</span>
              )}
            </button>

            <button
              onClick={() => setViewingUser(reel.author.id, 'reels')}
              className="text-white text-sm font-bold drop-shadow-lg hover:underline"
            >
              {reel.author.firstName} {reel.author.lastName}
            </button>

            {!isOwn && (
              <button
                onClick={() => followMut.mutate()}
                className={`ml-1 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  isFollowing
                    ? 'bg-white/15 text-white border border-white/40'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                {isFollowing ? (
                  <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Connected</span>
                ) : (
                  <span className="flex items-center gap-1"><UserPlus className="w-3 h-3" /> Connect</span>
                )}
              </button>
            )}
          </div>

          {reel.content && (
            <p className="text-white text-sm line-clamp-2 drop-shadow-lg leading-snug">
              {reel.content}
            </p>
          )}
        </div>

        {/* Right action sidebar — Facebook style */}
        <div className="absolute bottom-6 right-3 flex flex-col items-center gap-4 z-10">
          {/* Like — GREEN heart */}
          <button
            onClick={() => reactionMut.mutate()}
            className="flex flex-col items-center gap-1"
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <div className="w-11 h-11 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center">
              <Heart
                className={`w-6 h-6 transition-colors ${
                  liked ? 'fill-primary text-primary' : 'text-white'
                }`}
                strokeWidth={2.2}
              />
            </div>
            <span className="text-white text-[11px] font-semibold drop-shadow">
              {reel.reactionsCount > 0 ? formatCount(reel.reactionsCount) : 'Like'}
            </span>
          </button>

          {/* Comment */}
          <button className="flex flex-col items-center gap-1" aria-label="Comments">
            <div className="w-11 h-11 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" strokeWidth={2.2} />
            </div>
            <span className="text-white text-[11px] font-semibold drop-shadow">
              {reel.commentsCount > 0 ? formatCount(reel.commentsCount) : 'Comment'}
            </span>
          </button>

          {/* Share */}
          <button onClick={handleShare} className="flex flex-col items-center gap-1" aria-label="Share">
            <div className="w-11 h-11 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" strokeWidth={2.2} />
            </div>
            <span className="text-white text-[11px] font-semibold drop-shadow">
              {(reel.sharesCount || 0) > 0 ? formatCount(reel.sharesCount || 0) : 'Share'}
            </span>
          </button>

          {/* Bookmark */}
          <button onClick={() => bookmarkMut.mutate()} className="flex flex-col items-center gap-1" aria-label="Save">
            <div className="w-11 h-11 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center">
              <Bookmark
                className={`w-6 h-6 ${reel.isBookmarked ? 'fill-primary text-primary' : 'text-white'}`}
                strokeWidth={2.2}
              />
            </div>
            <span className="text-white text-[11px] font-semibold drop-shadow">
              {reel.isBookmarked ? 'Saved' : 'Save'}
            </span>
          </button>

          {/* Mute */}
          <button onClick={onMuteToggle} className="flex flex-col items-center gap-1" aria-label="Mute">
            <div className="w-11 h-11 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center">
              {muted ? (
                <VolumeX className="w-5 h-5 text-white" strokeWidth={2.2} />
              ) : (
                <Volume2 className="w-5 h-5 text-white" strokeWidth={2.2} />
              )}
            </div>
          </button>
        </div>
      </div>
    );
  }
);
ReelCard.displayName = 'ReelCard';
