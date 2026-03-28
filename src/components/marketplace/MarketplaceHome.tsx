'use client';

import { useState, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, Plus, Store } from 'lucide-react';
import { getListings } from '@/lib/api/marketplace';
import { useMarketplaceStore } from '@/store/marketplace.store';
import type { ListingFilters } from '@/lib/api/marketplace';
import type { MarketplaceListing } from '@/types/models';
import { ListingCategory } from '@/types/enums';
import CategoryChips from './CategoryChips';
import ListingCard from './ListingCard';
import FilterSheet from './FilterSheet';

export default function MarketplaceHome() {
  const { selectListing, setView, activeFilters, setFilters, clearFilters } = useMarketplaceStore();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<ListingCategory | 'ALL'>('ALL');
  const [filterOpen, setFilterOpen] = useState(false);

  const queryFilters: ListingFilters = {
    ...activeFilters,
    ...(catFilter !== 'ALL' ? { category: catFilter } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery({
      queryKey: ['marketplace', 'listings', queryFilters],
      queryFn: ({ pageParam }) =>
        getListings({ ...queryFilters, cursor: pageParam, limit: 20 }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.hasMore ? last.nextCursor : undefined,
    });

  const listings = data?.pages.flatMap((p) => p.items) ?? [];

  const handleCategoryChange = useCallback((cat: ListingCategory | 'ALL') => {
    setCatFilter(cat);
  }, []);

  const hasActiveFilters =
    activeFilters.listingType ||
    activeFilters.minPrice != null ||
    activeFilters.maxPrice != null;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 pt-4 pb-3 space-y-3">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store size={22} className="text-primary" />
            <h1 className="text-xl font-bold text-foreground">Mami Market</h1>
          </div>
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={15} />
            Sell
          </button>
        </div>

        {/* Search + filter row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search listings…"
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted border border-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            className={[
              'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
              hasActiveFilters
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-muted border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <SlidersHorizontal size={15} />
            Filter
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>

        {/* Categories */}
        <CategoryChips selected={catFilter} onChange={handleCategoryChange} />
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-4">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-3">😕</p>
            <p className="text-muted-foreground text-sm">Failed to load listings. Pull to retry.</p>
          </div>
        )}

        {!isLoading && !isError && listings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <p className="text-5xl">🛒</p>
            <p className="font-semibold text-foreground">No listings found</p>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              {search || catFilter !== 'ALL' || hasActiveFilters
                ? 'Try adjusting your search or filters.'
                : 'Be the first to list something in your state!'}
            </p>
            {(catFilter !== 'ALL' || hasActiveFilters) && (
              <button
                onClick={() => { setCatFilter('ALL'); clearFilters(); }}
                className="text-primary text-sm font-medium hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {!isLoading && listings.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {listings.map((listing: MarketplaceListing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={selectListing}
                />
              ))}
            </div>

            {hasNextPage && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-6 py-2.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  {isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* My listings shortcut */}
      <div className="px-4 pb-4">
        <button
          onClick={() => setView('my-listings')}
          className="w-full py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
        >
          <Store size={16} />
          View my listings
        </button>
      </div>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={activeFilters}
        onApply={(f) => setFilters(f)}
      />
    </div>
  );
}
