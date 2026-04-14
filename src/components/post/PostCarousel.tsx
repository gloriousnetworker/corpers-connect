'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Play, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reactToPost, removeReaction, sharePost, bookmarkPost, unbookmarkPost } from '@/lib/api/posts';
import { REACTION_EMOJI } from '@/lib/constants';
import { queryKeys } from '@/lib/query-keys';
import { getOptimisedUrl, formatCount, getInitials, getAvatarUrl } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';
import type { Post } from '@/types/models';
import type { ReactionType } from '@/types/enums';
import ReactionPicker from './ReactionPicker';

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url) || url.includes('/video/upload/');
}

interface PostCarouselProps {
  post: Post;
  initialIndex: number;
  onClose: () => void;
  onCommentClick: () => void;
  onOptimisticUpdate: (update: Partial<Post>) => void;
}

export default function PostCarousel({
  post,
  initialIndex,
  onClose,
  onCommentClick,
  onOptimisticUpdate,
}: PostCarouselProps) {
  const [index, setIndex] = useState(initialIndex);
  const [pickerOpen, setPickerOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();
  const haptic = useHaptic();

  const urls = post.mediaUrls;
  const url = urls[index];
  const isVideo = url ? isVideoUrl(url) : false;
  const hasMultiple = urls.length > 1;
  const author = post.author;
  const initials = getInitials(author.firstName, author.lastName);

  // ── Navigation ──────────────────────────────────────────────────────────
  const showPrev = useCallback(() => setIndex((i) => (i - 1 + urls.length) % urls.length), [urls.length]);
  const showNext = useCallback(() => setIndex((i) => (i + 1) % urls.length), [urls.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') showPrev();
      else if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, showPrev, showNext]);

  // ── Reactions ──────────────────────────────────────────────────────────
  const invalidateFeed = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.feed() });
    queryClient.invalidateQueries({ queryKey: queryKeys.post(post.id) });
  };

  const reactionMutation = useMutation({
    mutationFn: async (type: ReactionType | null) => {
      if (type === null) await removeReaction(post.id);
      else await reactToPost(post.id, type);
    },
    onMutate: (type: ReactionType | null) => {
      const prevReaction = post.myReaction;
      const prevCount = post.reactionsCount;
      const isRemoving = type === null || type === post.myReaction;
      onOptimisticUpdate({
        myReaction: isRemoving ? null : type,
        reactionsCount: isRemoving ? Math.max(0, prevCount - 1) : prevCount + (prevReaction ? 0 : 1),
      });
      return { prevReaction, prevCount };
    },
    onError: (_, __, ctx) => {
      if (ctx) onOptimisticUpdate({ myReaction: ctx.prevReaction, reactionsCount: ctx.prevCount });
      toast.error('Failed to update reaction');
    },
    onSettled: invalidateFeed,
  });

  const bookmarkMutation = useMutation({
    mutationFn: (shouldBookmark: boolean) => shouldBookmark ? bookmarkPost(post.id) : unbookmarkPost(post.id),
    onMutate: (should: boolean) => { onOptimisticUpdate({ isBookmarked: should }); },
    onError: (_e, should) => { onOptimisticUpdate({ isBookmarked: !should }); toast.error('Failed'); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks() }); invalidateFeed(); },
  });

  const handleReactionClick = () => {
    haptic.medium();
    reactionMutation.mutate(post.myReaction ? null : 'LIKE' as ReactionType);
  };
  const handleLongPressStart = () => { longPressTimer.current = setTimeout(() => setPickerOpen(true), 400); };
  const handleLongPressEnd = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Corpers Connect post', text: post.content?.slice(0, 100) ?? 'Check out this post' });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied!');
      }
      onOptimisticUpdate({ sharesCount: (post.sharesCount || 0) + 1 });
      const result = await sharePost(post.id);
      onOptimisticUpdate({ sharesCount: result.sharesCount });
    } catch { /* cancelled */ }
  };

  const hasReaction = !!post.myReaction;
  const reactionEmoji = post.myReaction ? REACTION_EMOJI[post.myReaction] : null;

  if (!url) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-3 py-2.5 bg-black/80 flex-shrink-0 z-10">
        <button onClick={onClose} className="p-2 rounded-full text-white hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
        {/* Author info */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
            {author.profilePicture ? (
              <Image src={getAvatarUrl(author.profilePicture, 64)} alt="" width={32} height={32} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs font-bold text-white uppercase">{initials}</span>
              </div>
            )}
          </div>
          <span className="text-white text-sm font-semibold truncate">
            {author.firstName} {author.lastName}
          </span>
        </div>
        {/* Counter */}
        {hasMultiple && (
          <span className="text-white/60 text-xs font-medium">{index + 1} / {urls.length}</span>
        )}
      </div>

      {/* ── Image area ───────────────────────────────────────────────── */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {isVideo ? (
          <video key={url} src={url} controls autoPlay playsInline preload="metadata" className="max-w-full max-h-full" />
        ) : (
          <Image
            key={url}
            src={getOptimisedUrl(url, 1600)}
            alt={`Image ${index + 1}`}
            width={1600}
            height={1600}
            sizes="(max-width: 768px) 100vw, 1200px"
            className="max-w-full max-h-full w-auto h-auto object-contain"
            priority
          />
        )}

        {/* Nav arrows */}
        {hasMultiple && (
          <>
            <button
              onClick={showPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={showNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {urls.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`rounded-full transition-all ${i === index ? 'w-2.5 h-2.5 bg-white' : 'w-2 h-2 bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Caption ──────────────────────────────────────────────────── */}
      {post.content && (
        <div className="px-4 py-2 bg-black/80 max-h-20 overflow-y-auto flex-shrink-0">
          <p className="text-white/90 text-sm leading-relaxed line-clamp-3">{post.content}</p>
        </div>
      )}

      {/* ── Reaction bar ─────────────────────────────────────────────── */}
      <div className="relative flex items-center gap-1 px-2 py-2 bg-black/90 border-t border-white/10 flex-shrink-0">
        {/* React */}
        <div className="relative flex-1">
          <button
            onPointerDown={handleLongPressStart}
            onPointerUp={handleLongPressEnd}
            onPointerLeave={handleLongPressEnd}
            onClick={handleReactionClick}
            className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-xl transition-colors text-sm font-medium ${
              hasReaction ? 'text-primary bg-primary/10' : 'text-white/70 hover:bg-white/10'
            }`}
          >
            <span className="text-base leading-none">{reactionEmoji ?? '👍'}</span>
            {post.reactionsCount > 0 && <span>{formatCount(post.reactionsCount)}</span>}
            {!hasReaction && !post.reactionsCount && <span>Like</span>}
          </button>
          <ReactionPicker
            open={pickerOpen}
            onPick={(type) => reactionMutation.mutate(type)}
            onClose={() => setPickerOpen(false)}
          />
        </div>

        {/* Comment */}
        <button
          onClick={() => { onClose(); setTimeout(onCommentClick, 100); }}
          className="flex flex-1 items-center justify-center gap-1.5 py-2 rounded-xl text-white/70 hover:bg-white/10 text-sm font-medium"
        >
          <MessageCircle className="w-4 h-4" />
          {post.commentsCount > 0 ? <span>{formatCount(post.commentsCount)}</span> : <span>Comment</span>}
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-1.5 py-2 rounded-xl text-white/70 hover:bg-white/10 text-sm font-medium"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={() => bookmarkMutation.mutate(!post.isBookmarked)}
          className={`flex items-center justify-center p-2 rounded-xl transition-colors ${
            post.isBookmarked ? 'text-amber-400' : 'text-white/70 hover:bg-white/10'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}
