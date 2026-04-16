'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, TrendingUp, Library, Plus, Wallet as WalletIcon } from 'lucide-react';
import { listBooks } from '@/lib/api/books';
import { queryKeys } from '@/lib/query-keys';
import type { Book, BookGenre } from '@/types/models';
import { useLibraryStore } from '@/store/library.store';
import BookCard from './BookCard';

const GENRES: { value: BookGenre | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'FICTION', label: 'Fiction' },
  { value: 'NON_FICTION', label: 'Non-Fiction' },
  { value: 'RELIGIOUS', label: 'Religious' },
  { value: 'SELF_HELP', label: 'Self-Help' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'BIOGRAPHY', label: 'Biography' },
  { value: 'POETRY', label: 'Poetry' },
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'TECHNOLOGY', label: 'Tech' },
  { value: 'HISTORY', label: 'History' },
  { value: 'OTHER', label: 'Other' },
];

export default function LibraryHome() {
  const openBook = useLibraryStore((s) => s.openBook);
  const setView = useLibraryStore((s) => s.setView);

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [genre, setGenre] = useState<BookGenre | 'ALL'>('ALL');
  const [sort, setSort] = useState<'trending' | 'newest' | 'bestseller'>('newest');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const params = {
    sort,
    ...(genre !== 'ALL' && { genre }),
    ...(debounced && { q: debounced }),
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.books(params),
    queryFn: () => listBooks(params),
    staleTime: 60_000,
  });

  // Trending strip (separate fetch so it stays stable as user filters)
  const { data: trending } = useQuery({
    queryKey: queryKeys.books({ sort: 'trending', limit: 10 }),
    queryFn: () => listBooks({ sort: 'trending', limit: 10 }),
    staleTime: 5 * 60_000,
  });

  const handleClick = (book: Book) => openBook(book.id);

  return (
    <div className="max-w-[680px] mx-auto pb-6">
      {/* Hero header */}
      <div className="px-4 pt-4 pb-3 bg-gradient-to-br from-primary/10 via-emerald-500/5 to-transparent">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-black text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Corpers Library
            </h1>
            <p className="text-xs text-foreground-muted mt-0.5">
              Books by corpers, for corpers. Buy once, read forever.
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1.5 mt-3">
          <button
            onClick={() => setView('my-library')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface border border-border text-xs font-semibold text-foreground-secondary hover:bg-surface-alt"
          >
            <Library className="w-3.5 h-3.5" />
            My Library
          </button>
          <button
            onClick={() => setView('my-published')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface border border-border text-xs font-semibold text-foreground-secondary hover:bg-surface-alt"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Published
          </button>
          <button
            onClick={() => setView('wallet')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface border border-border text-xs font-semibold text-foreground-secondary hover:bg-surface-alt"
          >
            <WalletIcon className="w-3.5 h-3.5" />
            Wallet
          </button>
          <button
            onClick={() => setView('publish')}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-semibold shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            Publish
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books, authors, topics…"
            className="w-full pl-9 pr-3 py-2.5 bg-surface-alt rounded-xl text-sm text-foreground placeholder:text-foreground-muted outline-none focus:ring-2 focus:ring-primary/30"
            style={{ fontSize: '16px' }}
          />
        </div>
      </div>

      {/* Trending strip */}
      {!debounced && genre === 'ALL' && trending && trending.items.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-1.5 px-4 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Trending</h2>
          </div>
          <div className="overflow-x-auto no-scrollbar pl-4">
            <div className="flex gap-3 pr-4">
              {trending.items.slice(0, 10).map((b) => (
                <div key={b.id} className="w-32 flex-shrink-0">
                  <BookCard book={b} onClick={handleClick} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Genre chips */}
      <div className="mt-4 overflow-x-auto no-scrollbar pl-4">
        <div className="flex gap-1.5 pr-4">
          {GENRES.map((g) => (
            <button
              key={g.value}
              onClick={() => setGenre(g.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                genre === g.value
                  ? 'bg-primary text-white'
                  : 'bg-surface-alt text-foreground-secondary hover:bg-surface-alt/70'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort strip */}
      <div className="flex items-center justify-between px-4 mt-3">
        <h2 className="text-sm font-bold text-foreground">
          {debounced ? `Results for "${debounced}"` : genre === 'ALL' ? 'All books' : GENRES.find((g) => g.value === genre)?.label}
        </h2>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'trending' | 'newest' | 'bestseller')}
          className="text-xs bg-surface-alt border border-border rounded-full px-2.5 py-1 text-foreground-secondary font-semibold cursor-pointer focus:outline-none"
        >
          <option value="newest">Newest</option>
          <option value="trending">Trending</option>
          <option value="bestseller">Bestseller</option>
        </select>
      </div>

      {/* Grid */}
      <div className="px-4 pt-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">No books here yet</p>
            <p className="text-xs text-foreground-muted mt-1">
              {debounced ? 'Try a different search' : 'Be the first to publish in this category!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-5">
            {data.items.map((b) => (
              <BookCard key={b.id} book={b} onClick={handleClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
