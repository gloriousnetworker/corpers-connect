'use client';

import Image from 'next/image';
import { BookOpen, Star, CheckCircle2 } from 'lucide-react';
import { getOptimisedUrl } from '@/lib/utils';
import type { Book } from '@/types/models';

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
  showOwnedBadge?: boolean;
}

export default function BookCard({ book, onClick, showOwnedBadge = true }: BookCardProps) {
  const priceNaira = book.priceKobo / 100;
  return (
    <button
      onClick={() => onClick(book)}
      className="group relative flex flex-col text-left rounded-xl overflow-hidden bg-surface active:scale-[0.98] transition"
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] w-full bg-gradient-to-br from-primary/5 to-emerald-500/10 overflow-hidden rounded-xl shadow-sm">
        <Image
          src={getOptimisedUrl(book.coverImageUrl, 400)}
          alt={book.title}
          fill
          className="object-cover group-hover:scale-[1.03] transition-transform"
          sizes="(max-width: 680px) 45vw, 200px"
        />
        {book.isOwned && showOwnedBadge && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
            <CheckCircle2 className="w-3 h-3" />
            Owned
          </div>
        )}
        {book.priceKobo === 0 && !book.isOwned && (
          <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
            FREE
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="mt-2 px-0.5">
        <h3 className="text-sm font-bold text-foreground line-clamp-1">{book.title}</h3>
        <p className="text-[11px] text-foreground-muted line-clamp-1 mt-0.5">
          {book.author ? `${book.author.firstName} ${book.author.lastName}` : 'Unknown author'}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          {book.reviewCount > 0 ? (
            <div className="flex items-center gap-0.5 text-[11px] text-foreground-secondary">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{book.avgRating.toFixed(1)}</span>
              <span className="text-foreground-muted">({book.reviewCount})</span>
            </div>
          ) : (
            <div className="flex items-center gap-0.5 text-[11px] text-foreground-muted">
              <BookOpen className="w-3 h-3" />
              <span>New</span>
            </div>
          )}
          <span className="text-xs font-bold text-primary">
            {book.priceKobo === 0 ? 'Free' : `₦${priceNaira.toLocaleString()}`}
          </span>
        </div>
      </div>
    </button>
  );
}
