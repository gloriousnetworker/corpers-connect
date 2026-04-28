'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  MessageSquare, Send, MoreVertical, Edit2, Trash2, ChevronDown, ChevronUp,
  Loader2, BadgeDollarSign, User, MessageCircle, X,
} from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getListingComments,
  createListingComment,
  updateListingComment,
  deleteListingComment,
} from '@/lib/api/marketplace';
import { createConversation } from '@/lib/api/conversations';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useMessagesStore } from '@/store/messages.store';
import { useMarketplaceStore } from '@/store/marketplace.store';
import { useUIStore } from '@/store/ui.store';
import { getAvatarUrl, getInitials, formatRelativeTime } from '@/lib/utils';
import MarketerBadge from '@/components/persona/MarketerBadge';
import type { ListingComment as ListingCommentType } from '@/types/models';

// ── User action mini sheet ────────────────────────────────────────────────────

interface UserActionSheetProps {
  userId: string;
  name: string;
  avatar?: string | null;
  initials: string;
  onClose: () => void;
}

function UserActionSheet({ userId, name, avatar, initials, onClose }: UserActionSheetProps) {
  const currentUser = useAuthStore((s) => s.user);
  const { viewSellerProfile } = useMarketplaceStore();
  const setPendingConversation = useMessagesStore((s) => s.setPendingConversation);
  const setActiveSection = useUIStore((s) => s.setActiveSection);
  const [loadingMsg, setLoadingMsg] = useState(false);

  const handleViewProfile = () => {
    viewSellerProfile(userId);
    onClose();
  };

  const handleMessage = async () => {
    if (!currentUser) return;
    setLoadingMsg(true);
    try {
      const conv = await createConversation({ type: 'DM', participantId: userId });
      setPendingConversation(conv);
      setActiveSection('messages');
      onClose();
    } catch {
      toast.error('Could not open chat');
    } finally {
      setLoadingMsg(false);
    }
  };

  // Don't show "Message" for own comments
  const isSelf = currentUser?.id === userId;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl shadow-2xl animate-slide-up">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* User preview */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
            {avatar ? (
              <Image src={getAvatarUrl(avatar, 80)} alt={name} width={40} height={40} className="object-cover w-full h-full" />
            ) : (
              <span className="text-sm font-bold text-primary uppercase">{initials}</span>
            )}
          </div>
          <p className="font-semibold text-foreground text-sm">{name}</p>
        </div>

        <div className="py-2">
          <button
            onClick={handleViewProfile}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-foreground hover:bg-surface-alt transition-colors"
          >
            <User className="w-4 h-4 text-foreground-secondary" />
            View profile
          </button>

          {!isSelf && (
            <button
              onClick={handleMessage}
              disabled={loadingMsg}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-foreground hover:bg-surface-alt transition-colors disabled:opacity-50"
            >
              {loadingMsg ? (
                <Loader2 className="w-4 h-4 text-foreground-secondary animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4 text-foreground-secondary" />
              )}
              {loadingMsg ? 'Opening chat…' : 'Send a message'}
            </button>
          )}
        </div>

        <div className="px-4 pb-6 pt-1">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-surface-alt text-sm font-semibold text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

interface ListingCommentsProps {
  listingId: string;
  listingOwnerId: string;
}

export default function ListingComments({ listingId, listingOwnerId }: ListingCommentsProps) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: queryKeys.listingComments(listingId),
    queryFn: ({ pageParam }) =>
      getListingComments(listingId, { cursor: pageParam as string | undefined, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
  });

  const comments = data?.pages.flatMap((p) => p.items) ?? [];
  const totalCount = comments.length + (hasNextPage ? '+' : '');

  return (
    <div className="space-y-4">
      {/* Heading */}
      <div className="flex items-center gap-2">
        <MessageSquare size={18} className="text-foreground" />
        <h2 className="font-semibold text-foreground">Bids & Comments</h2>
        {comments.length > 0 && (
          <span className="text-sm text-muted-foreground">({totalCount})</span>
        )}
      </div>

      {/* Comment list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-6">
          <MessageSquare size={28} className="text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No bids or comments yet. Be the first!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              listingId={listingId}
              listingOwnerId={listingOwnerId}
            />
          ))}

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full text-sm text-primary font-semibold py-2 disabled:opacity-50"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      )}

      {/* Comment input */}
      {user && (
        <CommentInput listingId={listingId} />
      )}
    </div>
  );
}

// ── Comment Item ──────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  listingId,
  listingOwnerId,
}: {
  comment: ListingCommentType;
  listingId: string;
  listingOwnerId: string;
}) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editBid, setEditBid] = useState<string>(comment.bidAmount?.toString() ?? '');
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [showUserAction, setShowUserAction] = useState(false);

  const isAuthor = user?.id === comment.authorId;
  const isListingOwner = user?.id === listingOwnerId;
  const canDelete = isAuthor || isListingOwner;
  const canEdit = isAuthor;

  const updateMutation = useMutation({
    mutationFn: () =>
      updateListingComment(listingId, comment.id, {
        content: editContent.trim(),
        bidAmount: editBid ? parseFloat(editBid) : undefined,
      }),
    onSuccess: () => {
      toast.success('Comment updated');
      setEditing(false);
      qc.invalidateQueries({ queryKey: queryKeys.listingComments(listingId) });
    },
    onError: (err: Error) => toast.error(err.message ?? 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteListingComment(listingId, comment.id),
    onSuccess: () => {
      toast.success('Comment deleted');
      qc.invalidateQueries({ queryKey: queryKeys.listingComments(listingId) });
    },
    onError: () => toast.error('Failed to delete comment'),
  });

  if (comment.isDeleted) {
    return (
      <div className="flex gap-3 opacity-60">
        <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
        <p className="text-sm text-muted-foreground italic py-2">This comment has been deleted</p>
      </div>
    );
  }

  const authorInitials = getInitials(comment.author.firstName, comment.author.lastName);

  return (
    <>
    <div className="flex gap-3">
      {/* Avatar — tappable */}
      <button
        onClick={() => setShowUserAction(true)}
        className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity active:scale-95"
      >
        {comment.author.profilePicture ? (
          <Image
            src={getAvatarUrl(comment.author.profilePicture, 72)}
            alt={authorInitials}
            width={36}
            height={36}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-xs font-bold text-primary uppercase">{authorInitials}</span>
        )}
      </button>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Name — tappable */}
            <button
              onClick={() => setShowUserAction(true)}
              className="text-sm font-semibold text-foreground truncate hover:underline text-left"
            >
              {comment.author.firstName} {comment.author.lastName}
            </button>
            {comment.author.isVerified && (
              <span className="text-primary flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
              </span>
            )}
            <MarketerBadge
              accountType={(comment.author as { accountType?: string }).accountType}
              size="sm"
            />
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-muted-foreground italic">(edited)</span>
            )}
          </div>

          {/* Menu */}
          {(canEdit || canDelete) && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
              >
                <MoreVertical size={14} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-border rounded-xl shadow-lg py-1 w-36 overflow-hidden">
                    {canEdit && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setEditing(true);
                          setEditContent(comment.content);
                          setEditBid(comment.bidAmount?.toString() ?? '');
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => { setMenuOpen(false); deleteMutation.mutate(); }}
                        disabled={deleteMutation.isPending}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-muted"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content or Edit form */}
        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value.slice(0, 1000))}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-primary resize-none"
              style={{ fontSize: '16px' }}
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editBid}
                onChange={(e) => setEditBid(e.target.value)}
                placeholder="Bid amount (optional)"
                className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-surface text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-primary"
                style={{ fontSize: '16px' }}
                min={0}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateMutation.mutate()}
                disabled={!editContent.trim() || updateMutation.isPending}
                className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-60"
              >
                {updateMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-foreground mt-1 leading-relaxed">{comment.content}</p>

            {/* Bid badge */}
            {comment.bidAmount != null && (
              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-semibold">
                <BadgeDollarSign size={12} />
                Bid: &#8358;{comment.bidAmount.toLocaleString('en-NG')}
              </span>
            )}
          </>
        )}

        {/* Replies toggle */}
        {(comment.repliesCount ?? 0) > 0 && !editing && (
          <button
            onClick={() => setRepliesExpanded((v) => !v)}
            className="flex items-center gap-1 mt-2 text-xs text-primary font-medium hover:underline"
          >
            {repliesExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {comment.repliesCount} {comment.repliesCount === 1 ? 'reply' : 'replies'}
          </button>
        )}

        {/* Expanded replies */}
        {repliesExpanded && comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 ml-2 pl-3 border-l-2 border-border space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                listingId={listingId}
                listingOwnerId={listingOwnerId}
              />
            ))}
          </div>
        )}
      </div>
    </div>

    {/* User action sheet */}
    {showUserAction && (
      <UserActionSheet
        userId={comment.authorId}
        name={`${comment.author.firstName} ${comment.author.lastName}`}
        avatar={comment.author.profilePicture}
        initials={authorInitials}
        onClose={() => setShowUserAction(false)}
      />
    )}
    </>
  );
}

// ── Comment Input ─────────────────────────────────────────────────────────────

function CommentInput({ listingId }: { listingId: string }) {
  const qc = useQueryClient();
  const [content, setContent] = useState('');
  const [showBid, setShowBid] = useState(false);
  const [bidAmount, setBidAmount] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      createListingComment(listingId, {
        content: content.trim(),
        bidAmount: showBid && bidAmount ? parseFloat(bidAmount) : undefined,
      }),
    onSuccess: () => {
      setContent('');
      setBidAmount('');
      setShowBid(false);
      qc.invalidateQueries({ queryKey: queryKeys.listingComments(listingId) });
    },
    onError: (err: Error) => toast.error(err.message ?? 'Failed to post comment'),
  });

  const canSubmit = content.trim().length > 0 && !createMutation.isPending;

  return (
    <div className="sticky bottom-0 bg-surface border-t border-border pt-3 pb-1 -mx-4 px-4 space-y-2">
      {/* Bid toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowBid((v) => !v)}
          className={[
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
            showBid
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400'
              : 'border-border text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          <BadgeDollarSign size={12} />
          {showBid ? 'Remove bid' : 'Add bid'}
        </button>
      </div>

      {/* Bid amount */}
      {showBid && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">&#8358;</span>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="Your bid amount"
            className="flex-1 px-3 py-2 rounded-xl border border-border bg-surface text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-primary"
            style={{ fontSize: '16px' }}
            min={0}
          />
        </div>
      )}

      {/* Text input + send */}
      <div className="flex items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 1000))}
          placeholder="Write a comment..."
          rows={1}
          className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-primary resize-none min-h-[40px] max-h-[120px]"
          style={{ fontSize: '16px' }}
          onInput={(e) => {
            const el = e.target as HTMLTextAreaElement;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
          }}
        />
        <button
          onClick={() => createMutation.mutate()}
          disabled={!canSubmit}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors flex-shrink-0"
        >
          {createMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
