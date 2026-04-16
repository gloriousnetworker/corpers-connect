'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, Loader2, Plus } from 'lucide-react';
import { getMyPublished } from '@/lib/api/books';
import { queryKeys } from '@/lib/query-keys';
import { useLibraryStore } from '@/store/library.store';
import BookCard from './BookCard';

export default function MyPublished() {
  const goBack = useLibraryStore((s) => s.goBack);
  const openBook = useLibraryStore((s) => s.openBook);
  const setView = useLibraryStore((s) => s.setView);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.myPublished(),
    queryFn: () => getMyPublished(),
    staleTime: 30_000,
  });

  const totalSales = data?.reduce((acc, b) => acc + b.totalSales, 0) ?? 0;

  return (
    <div className="max-w-[680px] mx-auto pb-6">
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-sm border-b border-border px-3 py-2 flex items-center gap-2">
        <button onClick={goBack} className="p-2 rounded-full hover:bg-surface-alt" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Published Books</p>
          <p className="text-[11px] text-foreground-muted">{data?.length ?? 0} books · {totalSales} lifetime sales</p>
        </div>
        <button
          onClick={() => setView('publish')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold"
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">No published books yet</p>
            <p className="text-xs text-foreground-muted mt-1 mb-4">
              Publish your first book and start earning.
            </p>
            <button
              onClick={() => setView('publish')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-white text-xs font-bold shadow"
            >
              <Plus className="w-4 h-4" />
              Publish a book
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-5">
            {data.map((b) => (
              <BookCard key={b.id} book={b} onClick={() => openBook(b.id)} showOwnedBadge={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
