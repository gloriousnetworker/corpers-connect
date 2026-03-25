'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CornerDownRight } from 'lucide-react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { getComments, addComment } from '@/lib/api/posts';
import { queryKeys } from '@/lib/query-keys';
import { formatCount } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { getInitials } from '@/lib/utils';
import CommentItem from './CommentItem';
import type { Comment } from '@/types/models';
import Image from 'next/image';

interface CommentSheetProps {
  postId: string;
  commentsCount: number;
  open: boolean;
  onClose: () => void;
}

export default function CommentSheet({
  postId,
  commentsCount,
  open,
  onClose,
}: CommentSheetProps) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: queryKeys.postComments(postId),
      queryFn: ({ pageParam }) =>
        getComments(postId, { cursor: pageParam as string | undefined }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => (last.hasMore ? last.nextCursor ?? undefined : undefined),
      enabled: open,
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
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const userInitials = currentUser
    ? getInitials(currentUser.firstName, currentUser.lastName)
    : 'C';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9000] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet — y animation only (no CSS transform conflict: sheet uses left/right/bottom positioning, not transform-based centering) */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 mx-auto z-[9001] w-full max-w-[680px] bg-surface rounded-t-2xl flex flex-col"
            style={{
              maxHeight: '85dvh',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Handle */}
            <div className="w-9 h-1 bg-border rounded-full mx-auto mt-3 flex-shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <h3 className="font-semibold text-foreground">
                {formatCount(commentsCount ?? 0)} {(commentsCount ?? 0) === 1 ? 'Comment' : 'Comments'}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-surface-alt transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-foreground-secondary" />
              </button>
            </div>

            {/* Comments list */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto overscroll-y-none px-4 py-4 space-y-4"
            >
              {isLoading && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-surface-alt skeleton flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-surface-alt skeleton rounded-full w-24" />
                        <div className="h-8 bg-surface-alt skeleton rounded-2xl w-full" />
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

            {/* Reply-to indicator */}
            {replyTo && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-t border-border flex-shrink-0">
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

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-3 px-4 py-3 border-t border-border flex-shrink-0"
            >
              {/* Current user avatar */}
              <div className="flex-shrink-0">
                {currentUser?.profilePicture ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={currentUser.profilePicture}
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

              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={replyTo ? `Reply to ${replyTo.author.firstName}...` : 'Write a comment...'}
                className="flex-1 bg-surface-alt rounded-full px-4 py-2 text-sm text-foreground placeholder:text-foreground-muted outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/30 transition-all"
                maxLength={500}
              />

              <button
                type="submit"
                disabled={!text.trim() || addMutation.isPending}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors"
                aria-label="Send comment"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
