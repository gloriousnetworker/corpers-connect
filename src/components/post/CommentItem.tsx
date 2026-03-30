'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Trash2, CornerDownRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteComment, reactToComment, removeCommentReaction } from '@/lib/api/posts';
import { queryKeys } from '@/lib/query-keys';
import { formatRelativeTime, getInitials, getAvatarUrl } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import type { Comment } from '@/types/models';
import type { PaginatedData } from '@/types/api';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface CommentItemProps {
  postId: string;
  comment: Comment;
  onReply?: (comment: Comment) => void;
  onDeleted?: () => void;
  isReply?: boolean;
}

export default function CommentItem({ postId, comment, onReply, onDeleted, isReply = false }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const isOwn = currentUser?.id === comment.authorId;

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);

  // ── Long-press handlers on the comment bubble ────────────────────────────
  const handlePointerDown = () => {
    longPressFiredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setShowEmojiPicker(true);
    }, 500);
  };
  const handlePointerUp = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowEmojiPicker(true);
  };

  // ── Delete mutation ───────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () => deleteComment(postId, comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.postComments(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });
      toast.success('Comment deleted');
      onDeleted?.();
    },
    onError: () => toast.error('Failed to delete comment'),
  });

  // ── Reaction mutation ─────────────────────────────────────────────────────
  const reactionMutation = useMutation({
    mutationFn: (vars: { emoji: string; hasReaction: boolean }) =>
      vars.hasReaction
        ? removeCommentReaction(postId, comment.id, vars.emoji)
        : reactToComment(postId, comment.id, vars.emoji),
    onSuccess: (updated) => {
      // Patch the comment in the infinite query cache
      queryClient.setQueryData<InfiniteData<PaginatedData<Comment>>>(
        queryKeys.postComments(postId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((c) => {
                if (c.id === updated.id) return updated;
                // Also patch inside replies
                if (c.replies) {
                  return {
                    ...c,
                    replies: c.replies.map((r) => (r.id === updated.id ? updated : r)),
                  };
                }
                return c;
              }),
            })),
          };
        }
      );
    },
    onError: () => toast.error('Failed to update reaction'),
  });

  const handleReact = (emoji: string) => {
    setShowEmojiPicker(false);
    const hasReaction = (comment.reactions ?? []).some(
      (r) => r.userId === currentUser?.id && r.emoji === emoji
    );
    reactionMutation.mutate({ emoji, hasReaction });
  };

  // ── Reaction groups ───────────────────────────────────────────────────────
  const reactionGroups = (comment.reactions ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  const author = comment.author;
  const initials = getInitials(author.firstName, author.lastName);

  return (
    <div className={`flex gap-3 ${isReply ? 'pl-10' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {author.profilePicture ? (
          <div className="relative w-8 h-8 rounded-full overflow-hidden">
            <Image src={getAvatarUrl(author.profilePicture, 64)} alt={initials} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{initials}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Emoji picker popover */}
        {showEmojiPicker && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowEmojiPicker(false)}
            />
            {/* Emoji row */}
            <div className="relative z-50 mb-1 inline-flex items-center gap-1 bg-surface border border-border rounded-full shadow-lg px-2 py-1.5">
              {QUICK_EMOJIS.map((emoji) => {
                const isActive = (comment.reactions ?? []).some(
                  (r) => r.userId === currentUser?.id && r.emoji === emoji
                );
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className={`text-xl leading-none transition-transform active:scale-110 hover:scale-125 ${
                      isActive ? 'opacity-60' : ''
                    }`}
                    aria-label={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Bubble */}
        <div
          className="bg-surface-alt rounded-2xl px-3 py-2 cursor-pointer select-none"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onContextMenu={handleContextMenu}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-semibold text-foreground">
              {author.firstName} {author.lastName}
            </span>
            {author.corperTag && author.corperTagLabel && (
              <span className="text-xs text-gold font-medium">{author.corperTagLabel}</span>
            )}
          </div>
          <p className="text-sm text-foreground leading-relaxed break-words">{comment.content}</p>
        </div>

        {/* Reaction badges */}
        {Object.entries(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 px-1">
            {Object.entries(reactionGroups).map(([emoji, count]) => {
              const isActive = (comment.reactions ?? []).some(
                (r) => r.userId === currentUser?.id && r.emoji === emoji
              );
              return (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="flex items-center gap-0.5 text-base active:scale-90 transition-transform"
                  aria-label={`${count} ${emoji} reaction${count > 1 ? 's' : ''}`}
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="text-[11px] text-foreground-secondary font-semibold ml-0.5">{count}</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="text-xs text-foreground-muted">{formatRelativeTime(comment.createdAt)}</span>
          {comment.isEdited && (
            <span className="text-xs text-foreground-muted italic">edited</span>
          )}
          {!isReply && onReply && (
            <button
              onClick={() => onReply(comment)}
              className="text-xs font-medium text-foreground-secondary hover:text-primary transition-colors flex items-center gap-1"
            >
              <CornerDownRight className="w-3 h-3" />
              Reply
            </button>
          )}
          {isOwn && (
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="text-xs font-medium text-danger/70 hover:text-danger transition-colors flex items-center gap-1"
              aria-label="Delete comment"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          )}
        </div>

        {/* Nested replies */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {!showReplies ? (
              <button
                onClick={() => setShowReplies(true)}
                className="text-xs font-medium text-primary hover:underline pl-1"
              >
                View {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            ) : (
              <div className="space-y-3 mt-2">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    postId={postId}
                    comment={reply}
                    isReply
                  />
                ))}
                <button
                  onClick={() => setShowReplies(false)}
                  className="text-xs font-medium text-foreground-secondary hover:text-foreground transition-colors pl-10"
                >
                  Hide replies
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
