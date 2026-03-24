'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Globe, Users, Lock, MapPin } from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { PostVisibility } from '@/types/enums';
import type { Post } from '@/types/models';
import MediaGrid from './MediaGrid';
import ReactionBar from './ReactionBar';
import CommentSheet from './CommentSheet';
import PostMenu from './PostMenu';
import ReportModal from './ReportModal';
import type { CreatePostPayload } from '@/lib/api/posts';

interface PostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
}

const VisibilityIcon = ({ visibility }: { visibility: PostVisibility }) => {
  const icons = {
    [PostVisibility.PUBLIC]: <Globe className="w-3 h-3" />,
    [PostVisibility.STATE]: <MapPin className="w-3 h-3" />,
    [PostVisibility.FRIENDS]: <Users className="w-3 h-3" />,
    [PostVisibility.ONLY_ME]: <Lock className="w-3 h-3" />,
  };
  const labels = {
    [PostVisibility.PUBLIC]: 'Public',
    [PostVisibility.STATE]: 'State',
    [PostVisibility.FRIENDS]: 'Friends',
    [PostVisibility.ONLY_ME]: 'Only me',
  };
  return (
    <span className="flex items-center gap-1 text-foreground-muted text-xs">
      {icons[visibility]}
      {labels[visibility]}
    </span>
  );
};

export default function PostCard({ post: initialPost, onEdit }: PostCardProps) {
  const [post, setPost] = useState<Post>(initialPost);
  const [commentOpen, setCommentOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  if (deleted) return null;

  const author = post.author;
  const initials = getInitials(author.firstName, author.lastName);

  const handleOptimisticUpdate = (update: Partial<Post>) => {
    setPost((prev) => ({ ...prev, ...update }));
  };

  return (
    <>
      <article className="bg-surface rounded-2xl border border-border shadow-card p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {author.profilePicture ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={author.profilePicture}
                    alt={initials}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary uppercase">{initials}</span>
                </div>
              )}
            </div>

            {/* Author info */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm text-foreground truncate">
                  {author.firstName} {author.lastName}
                </span>
                {author.corperTag && author.corperTagLabel && (
                  <span className="text-xs text-gold font-medium">{author.corperTagLabel}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <span className="text-xs text-foreground-muted">{author.servingState}</span>
                <span className="text-foreground-muted text-xs">·</span>
                <span className="text-xs text-foreground-muted">{formatRelativeTime(post.createdAt)}</span>
                {post.isEdited && (
                  <>
                    <span className="text-foreground-muted text-xs">·</span>
                    <span className="text-xs text-foreground-muted italic">edited</span>
                  </>
                )}
                <span className="text-foreground-muted text-xs">·</span>
                <VisibilityIcon visibility={post.visibility} />
              </div>
            </div>
          </div>

          {/* Menu */}
          <PostMenu
            post={post}
            onEdit={() => onEdit?.(post)}
            onReport={() => setReportOpen(true)}
            onOptimisticUpdate={handleOptimisticUpdate}
            onDelete={() => setDeleted(true)}
          />
        </div>

        {/* Content */}
        {post.content && (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
            {post.content}
          </p>
        )}

        {/* Media */}
        {post.mediaUrls.length > 0 && (
          <MediaGrid urls={post.mediaUrls} />
        )}

        {/* Reactions summary */}
        {(post.reactionsCount > 0 || post.commentsCount > 0) && (
          <div className="flex items-center justify-between text-xs text-foreground-muted pt-1">
            {post.reactionsCount > 0 && (
              <span>{post.reactionsCount} {post.reactionsCount === 1 ? 'reaction' : 'reactions'}</span>
            )}
            {post.commentsCount > 0 && (
              <button
                onClick={() => setCommentOpen(true)}
                className="hover:underline ml-auto"
              >
                {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </div>
        )}

        {/* Action bar */}
        <ReactionBar
          post={post}
          onCommentClick={() => setCommentOpen(true)}
          onOptimisticUpdate={handleOptimisticUpdate}
        />
      </article>

      {/* Comment sheet */}
      <CommentSheet
        postId={post.id}
        commentsCount={post.commentsCount}
        open={commentOpen}
        onClose={() => setCommentOpen(false)}
      />

      {/* Report modal */}
      <ReportModal
        postId={post.id}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </>
  );
}
