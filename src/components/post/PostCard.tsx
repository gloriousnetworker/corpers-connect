'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Globe, Users, Lock, MapPin, Tag } from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import { formatRelativeTime, getInitials, getAvatarUrl } from '@/lib/utils';
import { PostVisibility } from '@/types/enums';
import type { Post } from '@/types/models';
import MediaGrid from './MediaGrid';
import PostCarousel from './PostCarousel';
import ReactionBar from './ReactionBar';
import CommentSheet from './CommentSheet';
import InlineComments from './InlineComments';
import PostMenu from './PostMenu';
import ReportModal from './ReportModal';
import type { CreatePostPayload } from '@/lib/api/posts';

interface PostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  /** When true, the comment sheet opens automatically (used on post detail page) */
  autoOpenComments?: boolean;
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

export default function PostCard({ post: initialPost, onEdit, autoOpenComments = false }: PostCardProps) {
  const [post, setPost] = useState<Post>(initialPost);
  const [commentOpen, setCommentOpen] = useState(autoOpenComments);
  const [commentMediaIndex, setCommentMediaIndex] = useState<number | undefined>(undefined);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);
  const setViewingUser = useUIStore((s) => s.setViewingUser);

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
          <button
            onClick={() => setViewingUser(author.id, 'feed')}
            className="flex items-center gap-3 min-w-0 text-left"
          >
            {/* Avatar — use sized Cloudinary URL (80px covers 2x @40px) */}
            <div className="flex-shrink-0">
              {author.profilePicture ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={getAvatarUrl(author.profilePicture, 80)}
                    alt={initials}
                    fill
                    className="object-cover"
                    sizes="40px"
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
          </button>

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

        {/* Tagged friends — clickable chips that open each user's profile */}
        {post.taggedUsers && post.taggedUsers.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-foreground-secondary">
            <Tag className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="text-foreground-muted">with</span>
            {post.taggedUsers.slice(0, 3).map((u, i) => (
              <button
                key={u.id}
                onClick={() => setViewingUser(u.id, 'feed')}
                className="font-semibold text-primary hover:underline"
              >
                {u.firstName} {u.lastName}
                {i < Math.min(post.taggedUsers!.length, 3) - 1 && ','}
              </button>
            ))}
            {post.taggedUsers.length > 3 && (
              <span className="text-foreground-muted">
                and {post.taggedUsers.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Media */}
        {post.mediaUrls.length > 0 && (
          <MediaGrid urls={post.mediaUrls} onOpenCarousel={(i) => setCarouselIndex(i)} />
        )}

        {/* Reactions summary */}
        {(post.reactionsCount > 0 || post.commentsCount > 0 || (post.sharesCount || 0) > 0) && (
          <div className="flex items-center justify-between text-xs text-foreground-muted pt-1">
            {post.reactionsCount > 0 && (
              <span>{post.reactionsCount} {post.reactionsCount === 1 ? 'reaction' : 'reactions'}</span>
            )}
            <div className="flex items-center gap-3 ml-auto">
              {(post.sharesCount || 0) > 0 && (
                <span>{post.sharesCount} {post.sharesCount === 1 ? 'share' : 'shares'}</span>
              )}
              {post.commentsCount > 0 && (
                <button
                  onClick={() => setCommentOpen(true)}
                  className="hover:underline"
                >
                  {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action bar */}
        <ReactionBar
          post={post}
          onCommentClick={() => setCommentOpen(true)}
          onOptimisticUpdate={handleOptimisticUpdate}
        />
      </article>

      {/* Inline comments (post detail) or bottom sheet (feed) */}
      {autoOpenComments ? (
        <InlineComments
          postId={post.id}
          commentsCount={post.commentsCount}
          onCommentAdded={() => setPost((p) => ({ ...p, commentsCount: (p.commentsCount || 0) + 1 }))}
          onCommentDeleted={() => setPost((p) => ({ ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) }))}
        />
      ) : (
        <CommentSheet
          postId={post.id}
          commentsCount={post.commentsCount}
          open={commentOpen}
          onClose={() => { setCommentOpen(false); setCommentMediaIndex(undefined); }}
          onCommentAdded={() => setPost((p) => ({ ...p, commentsCount: (p.commentsCount || 0) + 1 }))}
          onCommentDeleted={() => setPost((p) => ({ ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) }))}
          mediaIndex={commentMediaIndex}
        />
      )}

      {/* Report modal */}
      <ReportModal
        postId={post.id}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />

      {/* Full-screen carousel with reactions */}
      {carouselIndex !== null && (
        <PostCarousel
          post={post}
          initialIndex={carouselIndex}
          onClose={() => setCarouselIndex(null)}
          onCommentClick={(idx) => { setCommentMediaIndex(idx); setCommentOpen(true); }}
          onOptimisticUpdate={handleOptimisticUpdate}
        />
      )}
    </>
  );
}
