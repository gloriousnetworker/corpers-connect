'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { ArrowLeft, BookmarkCheck } from 'lucide-react';
import { getSavedOpportunities } from '@/lib/api/opportunities';
import { useOpportunitiesStore } from '@/store/opportunities.store';
import type { Opportunity } from '@/types/models';
import OpportunityCard from './OpportunityCard';

export default function SavedOpportunities() {
  const { goBack, selectOpportunity } = useOpportunitiesStore();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ['saved-opportunities'],
      queryFn: ({ pageParam }) =>
        getSavedOpportunities({ cursor: pageParam, limit: 20 }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.hasMore ? last.nextCursor ?? undefined : undefined,
    });

  const opportunities = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="text-foreground hover:text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-foreground text-lg flex-1">Saved Opportunities</h1>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-2xl border border-border animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && opportunities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <BookmarkCheck size={48} className="text-muted-foreground/40" />
            <p className="font-semibold text-foreground">No saved opportunities</p>
            <p className="text-sm text-muted-foreground">Tap the bookmark icon on any opportunity to save it here</p>
          </div>
        )}

        {opportunities.map((opp: Opportunity) => (
          <OpportunityCard key={opp.id} opportunity={opp} onClick={selectOpportunity} />
        ))}

        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
}
