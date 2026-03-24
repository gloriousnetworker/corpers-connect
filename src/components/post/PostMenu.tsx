'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit2, Trash2, Bookmark, BookmarkX, Flag } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { deletePost, bookmarkPost, unbookmarkPost } from '@/lib/api/posts';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import type { Post } from '@/types/models';

interface PostMenuProps {
  post: Post;
  onEdit: () => void;
  onReport: () => void;
  onOptimisticUpdate: (update: Partial<Post>) => void;
  onDelete: () => void;
}

export default function PostMenu({
  post,
  onEdit,
  onReport,
  onOptimisticUpdate,
  onDelete,
}: PostMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isOwn = currentUser?.id === post.authorId;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const deleteMutation = useMutation({
    mutationFn: () => deletePost(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed() });
      toast.success('Post deleted');
      onDelete();
    },
    onError: () => toast.error('Failed to delete post'),
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
      setOpen(false);
    },
    onError: () => {
      onOptimisticUpdate({ isBookmarked: post.isBookmarked });
      toast.error('Failed to update bookmark');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks() });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed() });
    },
  });

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-full hover:bg-surface-alt transition-colors text-foreground-secondary"
        aria-label="Post options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-xl shadow-xl min-w-[160px] py-1 overflow-hidden"
          >
            {/* Bookmark */}
            <button
              onClick={() => bookmarkMutation.mutate()}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-foreground hover:bg-surface-alt transition-colors"
            >
              {post.isBookmarked ? (
                <>
                  <BookmarkX className="w-4 h-4 text-gold" />
                  <span>Remove bookmark</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Bookmark</span>
                </>
              )}
            </button>

            {isOwn && (
              <>
                {/* Edit — only within 15 minute window */}
                <button
                  onClick={() => { setOpen(false); onEdit(); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-foreground hover:bg-surface-alt transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit post</span>
                </button>

                {/* Delete */}
                <button
                  onClick={() => {
                    setOpen(false);
                    if (confirm('Delete this post? This cannot be undone.')) {
                      deleteMutation.mutate();
                    }
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete post</span>
                </button>
              </>
            )}

            {!isOwn && (
              <button
                onClick={() => { setOpen(false); onReport(); }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors"
              >
                <Flag className="w-4 h-4" />
                <span>Report post</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
