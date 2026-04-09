'use client';

import { useQuery, useInfiniteQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft, CheckCircle, Star, MessageCircle, ShoppingBag, AlertTriangle, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { getSellerProfile, getSellerListings, startMarketplaceChat } from '@/lib/api/marketplace';
import { queryKeys } from '@/lib/query-keys';
import { useMarketplaceStore } from '@/store/marketplace.store';
import { SellerStatus } from '@/types/enums';
import { getAvatarUrl, getInitials } from '@/lib/utils';
import type { MarketplaceListing } from '@/types/models';
import ListingCard from './ListingCard';

export default function SellerProfileView() {
  const { selectedSellerId, goBack, selectListing, openMarketplaceChat } = useMarketplaceStore();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: queryKeys.sellerProfile(selectedSellerId ?? ''),
    queryFn: () => getSellerProfile(selectedSellerId!),
    enabled: !!selectedSellerId,
  });

  const {
    data: listingsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: listingsLoading,
  } = useInfiniteQuery({
    queryKey: queryKeys.sellerListings(selectedSellerId ?? ''),
    queryFn: ({ pageParam }) =>
      getSellerListings(selectedSellerId!, { cursor: pageParam as string | undefined, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
    enabled: !!selectedSellerId,
  });

  const chatMutation = useMutation({
    mutationFn: () => {
      const listings = listingsData?.pages.flatMap((p) => p.items) ?? [];
      const firstListing = listings[0];
      if (!firstListing) throw new Error('No listings available to start a chat');
      return startMarketplaceChat(firstListing.id);
    },
    onSuccess: (result) => {
      openMarketplaceChat(result.conversationId);
    },
    onError: (err: Error) => toast.error(err.message ?? 'Could not start chat'),
  });

  const listings = listingsData?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading || !profile) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={goBack} className="text-foreground hover:text-primary transition-colors">
            <ArrowLeft size={22} />
          </button>
          <div className="h-5 bg-muted rounded w-32 animate-pulse" />
        </div>
        <div className="p-4 space-y-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted" />
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
          <div className="h-20 bg-muted rounded-xl" />
          <div className="h-20 bg-muted rounded-xl" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-16 bg-muted rounded-xl" />
            <div className="h-16 bg-muted rounded-xl" />
            <div className="h-16 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={goBack} className="text-foreground hover:text-primary transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-bold text-foreground text-lg">Seller Profile</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <AlertTriangle size={40} className="text-muted-foreground mb-3" />
          <p className="font-semibold text-foreground">Profile not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This seller profile may have been removed or is unavailable.
          </p>
        </div>
      </div>
    );
  }

  const isDeactivated = profile.sellerStatus === SellerStatus.DEACTIVATED;
  const isActive = profile.sellerStatus === SellerStatus.ACTIVE;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="text-foreground hover:text-primary transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-foreground text-lg flex-1 truncate">
          {profile.businessName}
        </h1>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Deactivated banner */}
        {isDeactivated && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertTriangle size={18} className="text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive font-medium">
              This seller profile has been deactivated
            </p>
          </div>
        )}

        {/* Profile header */}
        <div className="flex items-center gap-4">
          {profile.user.profilePicture ? (
            <Image
              src={getAvatarUrl(profile.user.profilePicture, 128)}
              alt={profile.user.firstName}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary">
                {getInitials(profile.user.firstName, profile.user.lastName)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-1.5 flex-wrap">
              {profile.businessName}
              {isActive && (
                <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {profile.user.firstName} {profile.user.lastName}
            </p>
          </div>
        </div>

        {/* Info cards */}
        <div className="space-y-3">
          <div className="p-3 rounded-xl border border-border bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">What they sell</p>
            <p className="text-sm text-foreground">{profile.whatTheySell}</p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">About</p>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {profile.businessDescription}
            </p>
          </div>
          <div className="p-3 rounded-xl border border-border bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Serving State</p>
            <p className="text-sm text-foreground">{profile.user.servingState}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 rounded-xl border border-border bg-muted/30">
            <div className="flex items-center gap-1 mb-1">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="text-lg font-bold text-foreground">
                {profile.averageRating > 0 ? profile.averageRating.toFixed(1) : '--'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl border border-border bg-muted/30">
            <span className="text-lg font-bold text-foreground mb-1">{profile.totalReviews}</span>
            <p className="text-xs text-muted-foreground">Reviews</p>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl border border-border bg-muted/30">
            <span className="text-lg font-bold text-foreground mb-1">{profile.totalListings}</span>
            <p className="text-xs text-muted-foreground">Listings</p>
          </div>
        </div>

        {/* Chat with Seller button */}
        {!isDeactivated && (
          <button
            onClick={() => chatMutation.mutate()}
            disabled={chatMutation.isPending || listings.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {chatMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <MessageCircle size={18} />
            )}
            {chatMutation.isPending ? 'Opening chat...' : 'Chat with Seller'}
          </button>
        )}

        {/* Listings section */}
        <div className="border-t border-border pt-5">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag size={18} className="text-foreground" />
            <h2 className="font-semibold text-foreground">Listings</h2>
            {listings.length > 0 && (
              <span className="text-sm text-muted-foreground">({listings.length})</span>
            )}
          </div>

          {listingsLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border overflow-hidden animate-pulse">
                  <div className="aspect-square bg-muted" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag size={32} className="text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No listings yet</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {listings.map((listing: MarketplaceListing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onClick={selectListing}
                  />
                ))}
              </div>

              {hasNextPage && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="px-6 py-2.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
