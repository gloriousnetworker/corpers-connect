'use client';

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  X, Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX,
  UserPlus, Check, Loader2,
} from 'lucide-react';
import { getFeed } from '@/lib/api/feed';
import { reactToPost, removeReaction, bookmarkPost, unbookmarkPost, sharePost } from '@/lib/api/posts';
import { followUser, unfollowUser } from '@/lib/api/users';
import { queryKeys } from '@/lib/query-keys';
import { useUIStore } from '@/store/ui.store';
import { getInitials, getAvatarUrl, formatCount } from '@/lib/utils';
import { PostType } from '@/types/enums';
import type { Post } from '@/types/models';
import type { ReactionType } from '@/types/enums';

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url) || url.includes('/video/upload/');
}

interface VideoSwiperModalProps {
  initialPost: Post;
  onClose: () => void;
}

export default function VideoSwiperModal({ initialPost, onClose }: VideoSwiperModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: queryKeys.feed(),
    queryFn: ({ pageParam }) => getFeed({ cursor: pageParam as string | undefined }),
    getNextPageParam: (last) => (last.hasMore ? (last.nextCursor ?? undefined) : undefined),
    initialPageParam: undefined as string | undefined,
    staleTime: 60_000,
  });

  // Build the swiper list: only posts with at least one video, with the
  // initial post first (deduped if it's already in the feed pages)
  const videoPosts = useMemo<Post[]>(() => {
    const seen = new Set<string>();
    const list: Post[] = [];
    if (initialPost.mediaUrls.some(isVideoUrl)) {
      list.push(initialPost);
      seen.add(initialPost.id);
    }
    for (const page of data?.pages ?? []) {
      for (const p of page.items) {
        if (seen.has(p.id)) continue;
        if (p.postType === PostType.REEL) continue;
        if (!p.mediaUrls.some(isVideoUrl)) continue;
        list.push(p);
        seen.add(p.id);
      }
    }
    return list;
  }, [data, initialPost]);

  // Lock body scroll + escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Track active video via IntersectionObserver
  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = cardRefs.current.indexOf(e.target as HTMLDivElement);
            if (idx !== -1) setActiveIndex(idx);
          }
        }
      },
      { threshold: 0.6 },
    );
    cardRefs.current.forEach((el) => el && observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, [videoPosts.length]);

  // Infinite-scroll sentinel
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '600px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const setCardRef = useCallback((el: HTMLDivElement | null, idx: number) => {
    cardRefs.current[idx] = el;
    if (el && observerRef.current) observerRef.current.observe(el);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Top bar with close */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 pt-3">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <span className="text-white text-sm font-bold drop-shadow">Videos</span>
        <div className="w-10" />
      </div>

      {/* Vertical snap scroll list */}
      <div
        ref={containerRef}
        className="flex flex-col overflow-y-auto snap-y snap-mandatory scrollbar-none flex-1"
      >
        {videoPosts.map((p, idx) => (
          <VideoCard
            key={p.id}
            post={p}
            isActive={idx === activeIndex}
            muted={muted}
            onMuteToggle={() => setMuted((m) => !m)}
            ref={(el) => setCardRef(el, idx)}
          />
        ))}
        <div ref={loadMoreRef} className="h-4 flex-shrink-0" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-4 absolute bottom-4 left-0 right-0 pointer-events-none">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── VideoCard ────────────────────────────────────────────────────────────────

interface VideoCardProps {
  post: Post;
  isActive: boolean;
  muted: boolean;
  onMuteToggle: () => void;
  ref: (el: HTMLDivElement | null) => void;
}

const VideoCard = forwardRef<HTMLDivElement, Omit<VideoCardProps, 'ref'>>(
  ({ post: initialPost, isActive, muted, onMuteToggle }, ref) => {
    const [post, setPost] = useState<Post>(initialPost);
    const [isFollowing, setIsFollowing] = useState<boolean>(!!initialPost.author.isFollowing);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const queryClient = useQueryClient();
    const setViewingUser = useUIStore((s) => s.setViewingUser);

    const videoUrl = post.mediaUrls.find(isVideoUrl) ?? post.mediaUrls[0];
    const initials = getInitials(post.author.firstName, post.author.lastName);
    const liked = post.myReaction === 'LOVE';

    const reactionMut = useMutation({
      mutationFn: async () => {
        if (liked) await removeReaction(post.id);
        else await reactToPost(post.id, 'LOVE' as ReactionType);
      },
      onMutate: () => {
        setPost((prev) => ({
          ...prev,
          myReaction: liked ? null : ('LOVE' as ReactionType),
          reactionsCount: liked ? Math.max(0, prev.reactionsCount - 1) : prev.reactionsCount + 1,
        }));
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.feed() });
      },
    });

    const bookmarkMut = useMutation({
      mutationFn: () => post.isBookmarked ? unbookmarkPost(post.id) : bookmarkPost(post.id),
      onMutate: () => setPost((p) => ({ ...p, isBookmarked: !p.isBookmarked })),
    });

    const followMut = useMutation({
      mutationFn: () => isFollowing ? unfollowUser(post.author.id) : followUser(post.author.id),
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
            title: 'Corpers Connect video',
            text: post.content?.slice(0, 100) ?? 'Check out this video',
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(window.location.href);
          toast.success('Link copied!');
        }
        setPost((prev) => ({ ...prev, sharesCount: (prev.sharesCount || 0) + 1 }));
        const result = await sharePost(post.id);
        setPost((prev) => ({ ...prev, sharesCount: result.sharesCount }));
      } catch { /* cancelled */ }
    };

    // Auto-play / pause based on visibility
    useEffect(() => {
      const v = videoRef.current;
      if (!v) return;
      if (isActive) v.play().catch(() => {});
      else v.pause();
    }, [isActive]);

    useEffect(() => {
      if (videoRef.current) videoRef.current.muted = muted;
    }, [muted]);

    return (
      <div
        ref={ref}
        className="relative flex-shrink-0 snap-start snap-always overflow-hidden bg-black w-full"
        style={{ height: '100dvh' }}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          loop
          playsInline
          muted={muted}
          preload={isActive ? 'metadata' : 'none'}
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* Author info — bottom-left with Connect button */}
        <div className="absolute bottom-0 left-0 right-20 p-4 z-10">
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <button
              onClick={() => setViewingUser(post.author.id, 'feed')}
              className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-white flex-shrink-0"
              aria-label="View profile"
            >
              {post.author.profilePicture ? (
                <Image
                  src={getAvatarUrl(post.author.profilePicture, 80)}
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
              onClick={() => setViewingUser(post.author.id, 'feed')}
              className="text-white text-sm font-bold drop-shadow-lg hover:underline"
            >
              {post.author.firstName} {post.author.lastName}
            </button>

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
          </div>

          {post.author.servingState && (
            <p className="text-white/85 text-xs mb-1 drop-shadow">{post.author.servingState}</p>
          )}

          {post.content && (
            <p className="text-white text-sm line-clamp-3 drop-shadow-lg leading-snug">
              {post.content}
            </p>
          )}
        </div>

        {/* Right action sidebar */}
        <div className="absolute bottom-6 right-3 flex flex-col items-center gap-4 z-10">
          {/* Like — green heart */}
          <button onClick={() => reactionMut.mutate()} className="flex flex-col items-center gap-1" aria-label="Like">
            <div className="w-11 h-11 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center">
              <Heart
                className={`w-6 h-6 transition-colors ${liked ? 'fill-primary text-primary' : 'text-white'}`}
                strokeWidth={2.2}
              />
            </div>
            <span className="text-white text-[11px] font-semibold drop-shadow">
              {post.reactionsCount > 0 ? formatCount(post.reactionsCount) : 'Like'}
            </span>
          </button>

          {/* Comment */}
          <button className="flex flex-col items-center gap-1" aria-label="Comments">
            <div className="w-11 h-11 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" strokeWidth={2.2} />
            </div>
            <span className="text-white text-[11px] font-semibold drop-shadow">
              {post.commentsCount > 0 ? formatCount(post.commentsCount) : 'Comment'}
            </span>
          </button>

          {/* Share */}
          <button onClick={handleShare} className="flex flex-col items-center gap-1" aria-label="Share">
            <div className="w-11 h-11 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" strokeWidth={2.2} />
            </div>
            <span className="text-white text-[11px] font-semibold drop-shadow">
              {(post.sharesCount || 0) > 0 ? formatCount(post.sharesCount || 0) : 'Share'}
            </span>
          </button>

          {/* Bookmark */}
          <button onClick={() => bookmarkMut.mutate()} className="flex flex-col items-center gap-1" aria-label="Save">
            <div className="w-11 h-11 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center">
              <Bookmark
                className={`w-6 h-6 ${post.isBookmarked ? 'fill-primary text-primary' : 'text-white'}`}
                strokeWidth={2.2}
              />
            </div>
            <span className="text-white text-[11px] font-semibold drop-shadow">
              {post.isBookmarked ? 'Saved' : 'Save'}
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
  },
);
VideoCard.displayName = 'VideoCard';
