'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Bookmark, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { reactToPost, removeReaction, sharePost } from '@/lib/api/posts';
import { bookmarkPost, unbookmarkPost } from '@/lib/api/posts';
import { REACTION_EMOJI } from '@/lib/constants';
import { queryKeys } from '@/lib/query-keys';
import { formatCount } from '@/lib/utils';
import type { Post } from '@/types/models';
import type { ReactionType } from '@/types/enums';
import ReactionPicker from './ReactionPicker';

interface ReactionBarProps {
  post: Post;
  onCommentClick: () => void;
  onOptimisticUpdate: (update: Partial<Post>) => void;
}

export default function ReactionBar({ post, onCommentClick, onOptimisticUpdate }: ReactionBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const invalidateFeed = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.feed() });
    queryClient.invalidateQueries({ queryKey: queryKeys.post(post.id) });
  };

  const reactionMutation = useMutation({
    mutationFn: async (type: ReactionType | null) => {
      if (type === null) {
        await removeReaction(post.id);
      } else {
        await reactToPost(post.id, type);
      }
    },
    onMutate: (type: ReactionType | null) => {
      // Optimistic update
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
      if (ctx) {
        onOptimisticUpdate({ myReaction: ctx.prevReaction, reactionsCount: ctx.prevCount });
      }
      toast.error('Failed to update reaction');
    },
    onSettled: invalidateFeed,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (post.isBookmarked) {
        await unbookmarkPost(post.id);
      } else {
        await bookmarkPost(post.id);
      }
    },
    onMutate: () => {
      onOptimisticUpdate({ isBookmarked: !post.isBookmarked });
    },
    onError: () => {
      onOptimisticUpdate({ isBookmarked: post.isBookmarked });
      toast.error('Failed to update bookmark');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks() });
      invalidateFeed();
    },
  });

  const handleReactionClick = () => {
    if (post.myReaction) {
      reactionMutation.mutate(null);
    } else {
      reactionMutation.mutate('LIKE' as ReactionType);
    }
  };

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => setPickerOpen(true), 400);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleShare = async () => {
    let shared = false;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Corpers Connect post',
          text: post.content?.slice(0, 100) ?? 'Check out this post',
          url: window.location.href,
        });
        shared = true;
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied!');
        shared = true;
      }
    } catch {
      // user cancelled share sheet — do not record
    }

    if (shared) {
      // Optimistic increment
      onOptimisticUpdate({ sharesCount: (post.sharesCount || 0) + 1 });
      try {
        const result = await sharePost(post.id);
        // Sync with server value
        onOptimisticUpdate({ sharesCount: result.sharesCount });
      } catch {
        // Roll back on error
        onOptimisticUpdate({ sharesCount: post.sharesCount || 0 });
      }
    }
  };

  const hasReaction = !!post.myReaction;
  const reactionEmoji = post.myReaction ? REACTION_EMOJI[post.myReaction] : null;

  return (
    <div className="relative flex items-center gap-1 pt-2 border-t border-border">
      {/* React button */}
      <div className="relative flex-1">
        <button
          onPointerDown={handleLongPressStart}
          onPointerUp={handleLongPressEnd}
          onPointerLeave={handleLongPressEnd}
          onClick={handleReactionClick}
          className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-xl transition-colors text-sm font-medium ${
            hasReaction
              ? 'text-primary bg-primary/5 hover:bg-primary/10'
              : 'text-foreground-secondary hover:bg-surface-alt'
          }`}
          aria-label="React to post"
        >
          <span className="text-base leading-none">
            {reactionEmoji ?? '👍'}
          </span>
          {post.reactionsCount > 0 && (
            <span>{formatCount(post.reactionsCount)}</span>
          )}
          {!hasReaction && !post.reactionsCount && <span>Like</span>}
        </button>
        <ReactionPicker
          open={pickerOpen}
          onPick={(type) => reactionMutation.mutate(type)}
          onClose={() => setPickerOpen(false)}
        />
      </div>

      {/* Comment button */}
      <button
        onClick={onCommentClick}
        className="flex flex-1 items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-surface-alt transition-colors text-sm font-medium text-foreground-secondary"
        aria-label="View comments"
      >
        <MessageCircle className="w-4 h-4" />
        {post.commentsCount > 0 ? (
          <span>{formatCount(post.commentsCount)}</span>
        ) : (
          <span>Comment</span>
        )}
      </button>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="flex flex-1 items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-surface-alt transition-colors text-sm font-medium text-foreground-secondary"
        aria-label="Share post"
      >
        <Share2 className="w-4 h-4" />
        {(post.sharesCount || 0) > 0 ? (
          <span>{formatCount(post.sharesCount || 0)}</span>
        ) : (
          <span>Share</span>
        )}
      </button>

      {/* Bookmark button */}
      <button
        onClick={() => bookmarkMutation.mutate()}
        className={`flex items-center justify-center p-2 rounded-xl transition-colors ${
          post.isBookmarked
            ? 'text-gold bg-gold/10 hover:bg-gold/20'
            : 'text-foreground-secondary hover:bg-surface-alt'
        }`}
        aria-label={post.isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
      >
        <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
}
