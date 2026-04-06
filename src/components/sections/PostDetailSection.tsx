'use client';

import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getPost } from '@/lib/api/posts';
import { queryKeys } from '@/lib/query-keys';
import { useUIStore } from '@/store/ui.store';
import PostCard from '@/components/post/PostCard';
import PostCardSkeleton from '@/components/post/PostCardSkeleton';

export default function PostDetailSection() {
  const postId = useUIStore((s) => s.viewingPostId);
  const previousSection = useUIStore((s) => s.previousSection);
  const setActiveSection = useUIStore((s) => s.setActiveSection);

  const { data: post, isLoading, isError } = useQuery({
    queryKey: queryKeys.post(postId!),
    queryFn: () => getPost(postId!),
    staleTime: 30_000,
    enabled: !!postId,
  });

  const goBack = () => setActiveSection(previousSection);

  return (
    <div className="max-w-[680px] mx-auto">
      {/* Header */}
      <div className="bg-surface border-b border-border flex items-center gap-3 px-4 h-12 -mt-3">
        <button
          onClick={goBack}
          className="p-1 -ml-1 text-foreground-muted hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold text-foreground">Post</h2>
      </div>

      {/* Content */}
      <div className="pt-2 pb-20">
        {isLoading ? (
          <PostCardSkeleton />
        ) : isError || !post ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <p className="text-3xl mb-3">🤔</p>
            <p className="font-semibold text-foreground">Post not found</p>
            <p className="text-sm text-foreground-muted mt-1">
              It may have been deleted or you don&apos;t have permission to view it.
            </p>
            <button
              onClick={goBack}
              className="mt-4 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold"
            >
              Go back
            </button>
          </div>
        ) : (
          <PostCard post={post} autoOpenComments />
        )}
      </div>
    </div>
  );
}
