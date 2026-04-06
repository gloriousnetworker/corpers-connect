'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, CornerDownRight, X } from 'lucide-react';
import EmojiPickerPopover from '@/components/ui/EmojiPickerPopover';
import { useEmojiInsertion } from '@/hooks/useEmojiInsertion';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { getComments, addComment } from '@/lib/api/posts';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import CommentItem from './CommentItem';
import type { Comment } from '@/types/models';
import Image from 'next/image';

interface InlineCommentsProps {
  postId: string;
  commentsCount: number;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
}

export default function InlineComments({
  postId,
  commentsCount,
  onCommentAdded,
  onCommentDeleted,
}: InlineCommentsProps) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const insertEmoji = useEmojiInsertion(inputRef, text, setText);
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: queryKeys.postComments(postId),
      queryFn: ({ pageParam }) =>
        getComments(postId, { cursor: pageParam as string | undefined }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => (last.hasMore ? last.nextCursor ?? undefined : undefined),
    });

  const comments = data?.pages.flatMap((p) => p.items) ?? [];

  const addMutation = useMutation({
    mutationFn: (payload: { content: string; parentId?: string }) =>
      addComment(postId, payload),
    onSuccess: () => {
      setText('');
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.postComments(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed() });
      onCommentAdded?.();
    },
    onError: () => toast.error('Failed to post comment'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    addMutation.mutate({ content: trimmed, parentId: replyTo?.id });
  };

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  const userInitials = currentUser
    ? getInitials(currentUser.firstName, currentUser.lastName)
    : 'C';

  return (
    <div className="border-t border-border">
      {/* Comments header */}
      <div className="px-4 py-3 border-b border-border bg-surface">
        <h3 className="font-semibold text-sm text-foreground">
          {commentsCount} {commentsCount === 1 ? 'Comment' : 'Comments'}
        </h3>
      </div>

      {/* Comment input — sticky at top so it's always visible */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border">
        {/* Reply-to indicator */}
        {replyTo && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b border-border">
            <CornerDownRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-sm text-foreground-secondary flex-1 truncate">
              Replying to{' '}
              <span className="text-primary font-medium">
                {replyTo.author.firstName}
              </span>
            </span>
            <button
              onClick={() => setReplyTo(null)}
              className="text-foreground-secondary hover:text-foreground transition-colors"
              aria-label="Cancel reply"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 px-4 py-3"
        >
          {/* Current user avatar */}
          <div className="flex-shrink-0">
            {currentUser?.profilePicture ? (
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src={getAvatarUrl(currentUser.profilePicture, 64)}
                  alt={userInitials}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{userInitials}</span>
              </div>
            )}
          </div>

          <div className="flex-1 flex items-center gap-1 bg-surface-alt rounded-full px-4 py-2 border border-transparent focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={replyTo ? `Reply to ${replyTo.author.firstName}...` : 'Write a comment...'}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-muted outline-none"
              maxLength={500}
            />
            <EmojiPickerPopover onEmojiSelect={insertEmoji} placement="above" />
          </div>

          <button
            type="submit"
            disabled={!text.trim() || addMutation.isPending}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors"
            aria-label="Send comment"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>

      {/* Comments list */}
      <div className="px-4 py-4 space-y-4">
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-surface-alt flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-surface-alt rounded-full w-24" />
                  <div className="h-8 bg-surface-alt rounded-2xl w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && comments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">💬</p>
            <p className="font-medium text-foreground">No comments yet</p>
            <p className="text-sm text-foreground-secondary mt-1">Be the first to comment!</p>
          </div>
        )}

        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            postId={postId}
            comment={comment}
            onReply={(c) => {
              setReplyTo(c);
              inputRef.current?.focus();
            }}
            onDeleted={onCommentDeleted}
          />
        ))}

        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full text-sm text-primary font-medium py-2 hover:underline"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more comments'}
          </button>
        )}
      </div>
    </div>
  );
}
