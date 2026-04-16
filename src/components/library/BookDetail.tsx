'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Star, BookOpen, Loader2, ShoppingCart, Eye, Tag as TagIcon, User } from 'lucide-react';
import { toast } from 'sonner';
import { getBook, initiateBookPurchase, listReviews, createReview } from '@/lib/api/books';
import { queryKeys } from '@/lib/query-keys';
import { getOptimisedUrl, getAvatarUrl, getInitials, formatRelativeTime } from '@/lib/utils';
import { useLibraryStore } from '@/store/library.store';
import { useAuthStore } from '@/store/auth.store';
import type { BookReview } from '@/types/models';

interface BookDetailProps {
  bookId: string;
}

export default function BookDetail({ bookId }: BookDetailProps) {
  const queryClient = useQueryClient();
  const goBack = useLibraryStore((s) => s.goBack);
  const openReader = useLibraryStore((s) => s.openReader);
  const currentUser = useAuthStore((s) => s.user);

  const [showAllDescription, setShowAllDescription] = useState(false);

  const { data: book, isLoading } = useQuery({
    queryKey: queryKeys.book(bookId),
    queryFn: () => getBook(bookId),
    staleTime: 60_000,
  });

  const { data: reviewsData } = useQuery({
    queryKey: queryKeys.bookReviews(bookId),
    queryFn: () => listReviews(bookId),
    staleTime: 60_000,
  });

  const purchaseMutation = useMutation({
    mutationFn: () => initiateBookPurchase(bookId, window.location.origin + '/'),
    onSuccess: (data) => {
      // Send user to Paystack checkout — webhook will complete the purchase
      window.location.href = data.authorizationUrl;
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Could not start payment');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!book) {
    return (
      <div className="p-6 text-center text-sm text-foreground-muted">
        Book not found
      </div>
    );
  }

  const priceNaira = book.priceKobo / 100;
  const isAuthor = currentUser?.id === book.authorId;
  const canRead = book.isOwned || isAuthor || book.priceKobo === 0;

  const descLong = book.description.length > 400;
  const displayedDesc =
    descLong && !showAllDescription ? book.description.slice(0, 400) + '…' : book.description;

  return (
    <div className="max-w-[680px] mx-auto pb-24">
      {/* Sticky back button */}
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-sm border-b border-border px-3 py-2 flex items-center gap-2">
        <button
          onClick={goBack}
          className="p-2 rounded-full hover:bg-surface-alt"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-sm font-semibold text-foreground truncate">{book.title}</p>
      </div>

      {/* Hero */}
      <div className="px-4 pt-5 pb-4 flex gap-4 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5">
        <div className="relative w-32 h-48 flex-shrink-0 rounded-xl overflow-hidden shadow-lg">
          <Image
            src={getOptimisedUrl(book.coverImageUrl, 400)}
            alt={book.title}
            fill
            className="object-cover"
            sizes="160px"
            priority
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <h1 className="text-lg font-black text-foreground leading-tight">{book.title}</h1>
          {book.subtitle && (
            <p className="text-xs text-foreground-muted italic mt-0.5">{book.subtitle}</p>
          )}
          {book.author && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-foreground-secondary">
              <User className="w-3 h-3" />
              <span className="font-semibold">
                {book.author.firstName} {book.author.lastName}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-foreground-muted">
            {book.reviewCount > 0 && (
              <div className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground-secondary">
                  {book.avgRating.toFixed(1)}
                </span>
                <span>({book.reviewCount})</span>
              </div>
            )}
            <span>{book.totalSales} sold</span>
            {book.pageCount && <span>{book.pageCount} pages</span>}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wide">
              {book.genre.replace('_', ' ')}
            </span>
            {book.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-full bg-surface-alt text-foreground-secondary text-[10px] font-medium"
              >
                <TagIcon className="inline w-2.5 h-2.5 mr-0.5" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 py-4 border-t border-border">
        <h2 className="text-sm font-bold text-foreground mb-2">About this book</h2>
        <p className="text-sm text-foreground-secondary leading-relaxed whitespace-pre-wrap">
          {displayedDesc}
        </p>
        {descLong && (
          <button
            onClick={() => setShowAllDescription((s) => !s)}
            className="mt-1 text-xs font-semibold text-primary"
          >
            {showAllDescription ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Back-cover image (if present) */}
      {book.backCoverImageUrl && (
        <div className="px-4 pb-4">
          <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden">
            <Image
              src={getOptimisedUrl(book.backCoverImageUrl, 680)}
              alt="Back cover"
              fill
              className="object-cover"
              sizes="(max-width: 680px) 100vw, 680px"
            />
          </div>
        </div>
      )}

      {/* About the author */}
      {book.aboutTheAuthor && (
        <div className="px-4 py-4 border-t border-border">
          <h2 className="text-sm font-bold text-foreground mb-2">About the author</h2>
          <div className="flex gap-3">
            {book.author?.profilePicture ? (
              <Image
                src={getAvatarUrl(book.author.profilePicture, 80)}
                alt=""
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : book.author ? (
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary uppercase">
                  {getInitials(book.author.firstName, book.author.lastName)}
                </span>
              </div>
            ) : null}
            <p className="text-sm text-foreground-secondary leading-relaxed whitespace-pre-wrap flex-1">
              {book.aboutTheAuthor}
            </p>
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-foreground">Reviews</h2>
          <span className="text-xs text-foreground-muted">{book.reviewCount} total</span>
        </div>
        {book.isOwned && <AddReviewForm bookId={bookId} existingRating={reviewsData?.items.find((r) => r.userId === currentUser?.id)?.rating} />}
        {reviewsData?.items.length === 0 ? (
          <p className="text-xs text-foreground-muted italic">No reviews yet — be the first to leave one after reading.</p>
        ) : (
          <ul className="space-y-3 mt-2">
            {reviewsData?.items.slice(0, 5).map((r) => (
              <ReviewItem key={r.id} review={r} />
            ))}
          </ul>
        )}
      </div>

      {/* Sticky footer CTA */}
      <div className="fixed bottom-14 inset-x-0 sm:static sm:bottom-auto z-30 bg-surface border-t border-border px-4 py-3 shadow-lg sm:shadow-none">
        <div className="max-w-[680px] mx-auto flex items-center gap-2">
          <button
            onClick={() => openReader(bookId)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-primary/30 text-primary text-sm font-bold"
          >
            <Eye className="w-4 h-4" />
            {canRead ? 'Read' : `Preview ${book.previewPages} pages`}
          </button>
          {!canRead && book.priceKobo > 0 && (
            <button
              onClick={() => purchaseMutation.mutate()}
              disabled={purchaseMutation.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow disabled:opacity-50"
            >
              {purchaseMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Buy ₦{priceNaira.toLocaleString()}
                </>
              )}
            </button>
          )}
          {canRead && (
            <button
              onClick={() => openReader(bookId)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow"
            >
              <BookOpen className="w-4 h-4" />
              Open book
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewItem({ review }: { review: BookReview }) {
  return (
    <li className="flex gap-2">
      {review.user.profilePicture ? (
        <Image
          src={getAvatarUrl(review.user.profilePicture, 72)}
          alt=""
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-primary uppercase">
            {getInitials(review.user.firstName, review.user.lastName)}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">
            {review.user.firstName} {review.user.lastName}
          </p>
          <span className="text-[11px] text-foreground-muted">
            {formatRelativeTime(review.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-0.5 mt-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-border'
              }`}
            />
          ))}
        </div>
        {review.content && (
          <p className="text-xs text-foreground-secondary mt-1 leading-relaxed">
            {review.content}
          </p>
        )}
      </div>
    </li>
  );
}

function AddReviewForm({ bookId, existingRating }: { bookId: string; existingRating?: number }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(existingRating ?? 0);
  const [content, setContent] = useState('');
  const [expanded, setExpanded] = useState(false);

  const mutation = useMutation({
    mutationFn: () => createReview(bookId, { rating, content: content.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookReviews(bookId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.book(bookId) });
      toast.success(existingRating ? 'Review updated' : 'Review posted');
      setExpanded(false);
      setContent('');
    },
    onError: () => toast.error('Could not save review'),
  });

  if (!expanded && !existingRating) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full py-2 rounded-lg border border-dashed border-border text-xs font-semibold text-foreground-secondary hover:bg-surface-alt"
      >
        + Leave a review
      </button>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-surface-alt">
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            onClick={() => setRating(i + 1)}
            className="p-0.5"
            aria-label={`${i + 1} stars`}
          >
            <Star
              className={`w-5 h-5 ${
                i < rating ? 'fill-amber-400 text-amber-400' : 'text-border'
              }`}
            />
          </button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts (optional)…"
        rows={3}
        maxLength={2000}
        className="w-full px-2.5 py-2 bg-surface rounded-lg text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        style={{ fontSize: '16px' }}
      />
      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          onClick={() => setExpanded(false)}
          className="text-xs font-semibold text-foreground-muted"
        >
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={rating === 0 || mutation.isPending}
          className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-bold disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving…' : existingRating ? 'Update' : 'Post'}
        </button>
      </div>
    </div>
  );
}
