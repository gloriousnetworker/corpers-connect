'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { getMyListings, updateListing } from '@/lib/api/marketplace';
import { useMarketplaceStore } from '@/store/marketplace.store';
import { ListingStatus } from '@/types/enums';
import type { MarketplaceListing } from '@/types/models';

const STATUS_STYLES: Record<ListingStatus, string> = {
  [ListingStatus.ACTIVE]:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  [ListingStatus.SOLD]:     'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  [ListingStatus.INACTIVE]: 'bg-muted text-muted-foreground',
  [ListingStatus.REMOVED]:  'bg-muted text-muted-foreground',
};

export default function MyListings() {
  const qc = useQueryClient();
  const { goBack, selectListing, setView } = useMarketplaceStore();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ['marketplace', 'my-listings'],
      queryFn: ({ pageParam }) =>
        getMyListings({ cursor: pageParam, limit: 20 }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.hasMore ? last.nextCursor : undefined,
    });

  const markSoldMutation = useMutation({
    mutationFn: (id: string) => updateListing(id, { status: ListingStatus.SOLD }),
    onSuccess: () => {
      toast.success('Marked as sold');
      qc.invalidateQueries({ queryKey: ['marketplace', 'my-listings'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const listings = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="text-foreground hover:text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-foreground text-lg flex-1">My Listings</h1>
        <button
          onClick={() => setView('create')}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/90"
        >
          <Plus size={14} /> New
        </button>
      </div>

      <div className="flex-1 px-4 py-4">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-20 h-20 rounded-xl bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && listings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Package size={48} className="text-muted-foreground/40" />
            <p className="font-semibold text-foreground">No listings yet</p>
            <p className="text-sm text-muted-foreground">Start selling in Mami Market!</p>
            <button
              onClick={() => setView('create')}
              className="mt-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Create listing
            </button>
          </div>
        )}

        {!isLoading && listings.length > 0 && (
          <div className="space-y-3">
            {listings.map((listing: MarketplaceListing) => (
              <div
                key={listing.id}
                className="flex gap-3 p-3 rounded-xl border border-border bg-surface hover:bg-muted/30 transition-colors"
              >
                {/* Thumbnail */}
                <button
                  onClick={() => selectListing(listing)}
                  className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-muted"
                >
                  {listing.images[0] ? (
                    <Image
                      src={listing.images[0]}
                      alt={listing.title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground/30">
                      📦
                    </div>
                  )}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => selectListing(listing)}
                    className="text-sm font-semibold text-foreground line-clamp-1 text-left hover:text-primary"
                  >
                    {listing.title}
                  </button>
                  <p className="text-base font-bold text-primary mt-0.5">
                    {listing.price != null
                      ? `₦${listing.price.toLocaleString('en-NG')}`
                      : 'Free'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[listing.status]}`}>
                      {listing.status}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {listing.viewCount} views
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 justify-center flex-shrink-0">
                  <button
                    onClick={() => { selectListing(listing); setTimeout(() => useMarketplaceStore.getState().setView('edit'), 0); }}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                  >
                    Edit
                  </button>
                  {listing.status === ListingStatus.ACTIVE && (
                    <button
                      onClick={() => markSoldMutation.mutate(listing.id)}
                      disabled={markSoldMutation.isPending}
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      {markSoldMutation.isPending ? <Loader2 size={10} className="animate-spin mx-auto" /> : 'Sold'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
