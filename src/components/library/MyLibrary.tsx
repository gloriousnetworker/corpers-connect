'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Library, Loader2 } from 'lucide-react';
import { getMyLibrary } from '@/lib/api/books';
import { queryKeys } from '@/lib/query-keys';
import { useLibraryStore } from '@/store/library.store';
import BookCard from './BookCard';

export default function MyLibrary() {
  const goBack = useLibraryStore((s) => s.goBack);
  const openBook = useLibraryStore((s) => s.openBook);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.myLibrary(),
    queryFn: () => getMyLibrary({ limit: 50 }),
    staleTime: 30_000,
  });

  return (
    <div className="max-w-[680px] mx-auto pb-6">
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-sm border-b border-border px-3 py-2 flex items-center gap-2">
        <button onClick={goBack} className="p-2 rounded-full hover:bg-surface-alt" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-sm font-bold text-foreground">My Library</p>
          <p className="text-[11px] text-foreground-muted">Books you&apos;ve purchased</p>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="py-12 text-center">
            <Library className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Your library is empty</p>
            <p className="text-xs text-foreground-muted mt-1">
              Books you buy will appear here, ready to read anytime.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-5">
            {data.items.map((b) => (
              <BookCard key={b.id} book={b} onClick={() => openBook(b.id)} showOwnedBadge={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
