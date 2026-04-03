'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, Loader2, Trash2 } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getListingReviews, createListingReview, deleteListingReview } from '@/lib/api/marketplace';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import type { ListingReviewsPage } from '@/types/models';

interface ListingReviewsProps {
  listingId: string;
  sellerId: string;
}

export default function ListingReviews({ listingId, sellerId }: ListingReviewsProps) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: queryKeys.listingReviews(listingId),
    queryFn: ({ pageParam }) =>
      getListingReviews(listingId, { cursor: pageParam as string | undefined }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 60_000,
  });

  const firstPage: ListingReviewsPage | undefined = data?.pages[0];
  const reviews = data?.pages.flatMap((p) => p.items) ?? [];
  const averageRating = firstPage?.averageRating ?? 0;
  const totalReviews = firstPage?.totalReviews ?? 0;

  const hasReviewed = reviews.some((r) => r.authorId === user?.id);
  const isOwner = user?.id === sellerId;

  const createMutation = useMutation({
    mutationFn: () => createListingReview(listingId, { rating: selectedRating, comment: comment.trim() || undefined }),
    onSuccess: () => {
      toast.success('Review submitted!');
      setSelectedRating(0);
      setComment('');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: queryKeys.listingReviews(listingId) });
    },
    onError: (err: Error) => toast.error(err.message ?? 'Failed to submit review'),
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => deleteListingReview(listingId, reviewId),
    onSuccess: () => {
      toast.success('Review deleted');
      qc.invalidateQueries({ queryKey: queryKeys.listingReviews(listingId) });
    },
    onError: () => toast.error('Failed to delete review'),
  });

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3">
        <h2 className="font-semibold text-foreground">Reviews</h2>
        {totalReviews > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRow rating={averageRating} size={14} />
            <span className="text-sm text-foreground-muted">
              {averageRating.toFixed(1)} ({totalReviews})
            </span>
          </div>
        )}
      </div>

      {/* Write review CTA */}
      {user && !isOwner && !hasReviewed && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-surface-alt transition-colors"
        >
          Write a review
        </button>
      )}

      {/* Review form */}
      {showForm && (
        <div className="p-4 rounded-xl border border-border bg-surface-alt space-y-3">
          <p className="text-sm font-medium text-foreground">Your rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setSelectedRating(n)}
                className="p-0.5"
              >
                <Star
                  size={28}
                  className={`transition-colors ${
                    n <= (hoverRating || selectedRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-border'
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 1000))}
            placeholder="Share your experience (optional)"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-primary resize-none"
            style={{ fontSize: '16px' }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setSelectedRating(0); setComment(''); }}
              className="flex-1 py-2 rounded-xl border border-border text-sm font-medium hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={selectedRating === 0 || createMutation.isPending}
              className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Review list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-surface-alt flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-surface-alt rounded w-1/3" />
                <div className="h-3 bg-surface-alt rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-foreground-muted text-center py-4">
          No reviews yet. Be the first!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                {review.author.profilePicture ? (
                  <Image
                    src={getAvatarUrl(review.author.profilePicture, 72)}
                    alt={getInitials(review.author.firstName, review.author.lastName)}
                    width={36}
                    height={36}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-xs font-bold text-primary uppercase">
                    {getInitials(review.author.firstName, review.author.lastName)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {review.author.firstName} {review.author.lastName}
                  </p>
                  {review.authorId === user?.id && (
                    <button
                      onClick={() => deleteMutation.mutate(review.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1 text-foreground-muted hover:text-error transition-colors disabled:opacity-50"
                      aria-label="Delete review"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <StarRow rating={review.rating} size={12} />
                {review.comment && (
                  <p className="text-sm text-foreground-muted mt-1 leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          ))}

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full text-sm text-primary font-semibold py-2 disabled:opacity-50"
            >
              {isFetchingNextPage ? 'Loading…' : 'Load more reviews'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-border'}
        />
      ))}
    </div>
  );
}
