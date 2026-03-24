'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Trash2, CornerDownRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteComment } from '@/lib/api/posts';
import { queryKeys } from '@/lib/query-keys';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import type { Comment } from '@/types/models';

interface CommentItemProps {
  postId: string;
  comment: Comment;
  onReply?: (comment: Comment) => void;
  isReply?: boolean;
}

export default function CommentItem({ postId, comment, onReply, isReply = false }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const isOwn = currentUser?.id === comment.authorId;

  const deleteMutation = useMutation({
    mutationFn: () => deleteComment(postId, comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.postComments(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });
      toast.success('Comment deleted');
    },
    onError: () => toast.error('Failed to delete comment'),
  });

  const author = comment.author;
  const initials = getInitials(author.firstName, author.lastName);

  return (
    <div className={`flex gap-3 ${isReply ? 'pl-10' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {author.profilePicture ? (
          <div className="relative w-8 h-8 rounded-full overflow-hidden">
            <Image src={author.profilePicture} alt={initials} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{initials}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-surface-alt rounded-2xl px-3 py-2">
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
