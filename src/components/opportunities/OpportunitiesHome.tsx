'use client';

import { useState, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, Briefcase, Plus, Wifi } from 'lucide-react';
import { getOpportunities } from '@/lib/api/opportunities';
import { useOpportunitiesStore } from '@/store/opportunities.store';
import { OpportunityType } from '@/types/enums';
import type { Opportunity } from '@/types/models';
import TypeChips from './TypeChips';
import OpportunityCard from './OpportunityCard';

export default function OpportunitiesHome() {
  const { selectOpportunity, setView, activeFilters, setFilters } = useOpportunitiesStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<OpportunityType | 'ALL'>('ALL');
  const [remoteOnly, setRemoteOnly] = useState(false);

  const queryFilters = {
    ...activeFilters,
    ...(typeFilter !== 'ALL' ? { type: typeFilter } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(remoteOnly ? { isRemote: true } : {}),
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery({
      queryKey: ['opportunities', queryFilters],
      queryFn: ({ pageParam }) =>
        getOpportunities({ ...queryFilters, cursor: pageParam, limit: 20 }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.hasMore ? last.nextCursor ?? undefined : undefined,
    });

  const opportunities = data?.pages.flatMap((p) => p.items) ?? [];

  const handleTypeChange = useCallback((t: OpportunityType | 'ALL') => {
    setTypeFilter(t);
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 pt-4 pb-3 space-y-3">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase size={22} className="text-primary" />
            <h1 className="text-xl font-bold text-foreground">Opportunities</h1>
          </div>
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={15} />
            Post
          </button>
        </div>

        {/* Search row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs, companies…"
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted border border-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <button
            onClick={() => setRemoteOnly((v) => !v)}
            className={[
              'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
              remoteOnly
                ? 'bg-teal-100 border-teal-400 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                : 'bg-muted border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <Wifi size={14} />
            Remote
          </button>
        </div>

        {/* Type chips */}
        <TypeChips selected={typeFilter} onChange={handleTypeChange} />
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-2xl border border-border animate-pulse space-y-3">
                <div className="flex gap-3">
                  <div className="w-11 h-11 rounded-xl bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-muted rounded-full" />
                  <div className="h-5 w-20 bg-muted rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-3">😕</p>
            <p className="text-muted-foreground text-sm">Failed to load opportunities.</p>
          </div>
        )}

        {!isLoading && !isError && opportunities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <p className="text-5xl">💼</p>
            <p className="font-semibold text-foreground">No opportunities found</p>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              {search || typeFilter !== 'ALL' || remoteOnly
                ? 'Try adjusting your search or filters.'
                : 'Be the first to post an opportunity for your fellow corps members!'}
            </p>
            {(typeFilter !== 'ALL' || remoteOnly || search) && (
              <button
                onClick={() => { setTypeFilter('ALL'); setRemoteOnly(false); setSearch(''); }}
                className="text-primary text-sm font-medium hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {!isLoading && opportunities.length > 0 && (
          <>
            {opportunities.map((opp: Opportunity) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onClick={selectOpportunity}
              />
            ))}

            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            )}
          </>
        )}
      </div>

      {/* My activity shortcuts */}
      <div className="px-4 pb-6 flex gap-2">
        <button
          onClick={() => setView('my-posts')}
          className="flex-1 py-2.5 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
        >
          <Briefcase size={13} /> My Posts
        </button>
        <button
          onClick={() => setView('saved')}
          className="flex-1 py-2.5 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
        >
          🔖 Saved
        </button>
        <button
          onClick={() => setView('my-applications')}
          className="flex-1 py-2.5 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
        >
          📋 Applications
        </button>
      </div>
    </div>
  );
}
