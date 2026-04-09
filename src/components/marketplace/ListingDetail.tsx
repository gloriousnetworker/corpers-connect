'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Eye, MessageCircle, Share2,
  Edit2, Trash2, CheckCircle, MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { getListing, deleteListing, startMarketplaceChat } from '@/lib/api/marketplace';
import { useMarketplaceStore } from '@/store/marketplace.store';
import { useAuthStore } from '@/store/auth.store';

import { ListingStatus, ListingType } from '@/types/enums';
import Image from 'next/image';
import { getAvatarUrl } from '@/lib/utils';
import ImageGallery from './ImageGallery';
import ListingReviews from './ListingReviews';
import ListingComments from './ListingComments';

const TYPE_LABEL: Record<ListingType, string> = {
  [ListingType.FOR_SALE]: 'For Sale',
  [ListingType.FOR_RENT]: 'For Rent',
  [ListingType.SERVICE]:  'Service',
  [ListingType.FREE]:     'Free',
};

export default function ListingDetail() {
  const qc = useQueryClient();
  const { selectedListing, goBack, setView, clearListing, viewSellerProfile, openMarketplaceChat } = useMarketplaceStore();
  const user = useAuthStore((s) => s.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['marketplace', 'listing', selectedListing?.id],
    queryFn: () => getListing(selectedListing!.id),
    enabled: !!selectedListing,
    initialData: selectedListing ?? undefined,
  });

  const chatMutation = useMutation({
    mutationFn: () => startMarketplaceChat(listing!.id),
    onSuccess: (result) => {
      openMarketplaceChat(result.conversationId);
    },
    onError: () => toast.error('Could not contact seller. Try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteListing(listing!.id),
    onSuccess: () => {
      toast.success('Listing deleted');
      qc.invalidateQueries({ queryKey: ['marketplace'] });
      clearListing();
    },
    onError: () => toast.error('Failed to delete listing'),
  });

  const handleShare = useCallback(async () => {
    if (!listing) return;
    const text = `${listing.title} — ${listing.price != null ? `₦${listing.price.toLocaleString()}` : 'Free'} on Corpers Connect`;
    if (navigator.share) {
      await navigator.share({ title: listing.title, text });
    } else {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard');
    }
  }, [listing]);

  if (isLoading || !listing) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
          <button onClick={goBack} className="text-foreground">
            <ArrowLeft size={22} />
          </button>
        </div>
        <div className="p-4 space-y-3 animate-pulse">
          <div className="aspect-square bg-muted rounded-xl" />
          <div className="h-5 bg-muted rounded w-3/4" />
          <div className="h-7 bg-muted rounded w-1/3" />
        </div>
      </div>
    );
  }

  const isOwner = user?.id === listing.sellerId;
  const isSold  = listing.status === ListingStatus.SOLD;
  const isActive = listing.status === ListingStatus.ACTIVE;

  return (
    <div className="flex flex-col min-h-full">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={goBack} className="text-foreground hover:text-primary transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <Share2 size={18} />
          </button>
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <MoreVertical size={18} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-border rounded-xl shadow-lg py-1 w-40 overflow-hidden">
                    <button
                      onClick={() => { setMenuOpen(false); setView('edit'); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                    >
                      <Edit2 size={15} /> Edit listing
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); setDeleteConfirm(true); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-muted"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-5">
        {/* Image gallery */}
        <ImageGallery images={listing.images} alt={listing.title} />

        {/* Type + status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {TYPE_LABEL[listing.listingType]}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
            {listing.category}
          </span>
          {isSold && (
            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold">
              SOLD
            </span>
          )}
          {listing.isBoost && (
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
              ⚡ Boosted
            </span>
          )}
        </div>

        {/* Title + price */}
        <div>
          <h1 className="text-xl font-bold text-foreground leading-tight">{listing.title}</h1>
          {listing.price != null ? (
            <p className="text-2xl font-black text-primary mt-1">
              ₦{listing.price.toLocaleString('en-NG')}
            </p>
          ) : (
            <p className="text-2xl font-black text-amber-500 mt-1">Free</p>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {listing.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} /> {listing.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Eye size={14} /> {listing.viewCount} views
          </span>
        </div>

        {/* Description */}
        <div>
          <h2 className="font-semibold text-foreground mb-2">Description</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {listing.description}
          </p>
        </div>

        {/* Reviews */}
        <div className="border-t border-border pt-5">
          <ListingReviews listingId={listing.id} sellerId={listing.sellerId} />
        </div>

        {/* Bids & Comments */}
        <div className="border-t border-border pt-5">
          <ListingComments listingId={listing.id} listingOwnerId={listing.sellerId} />
        </div>

        {/* Seller card */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 cursor-pointer hover:bg-muted/60 transition-colors"
          onClick={() => viewSellerProfile(listing.sellerId)}
        >
          {listing.seller.profilePicture ? (
              <Image
                src={getAvatarUrl(listing.seller.profilePicture, 88)}
                alt={listing.seller.firstName}
                width={44}
                height={44}
                className="rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-semibold text-base">
                {listing.seller.firstName[0]}
              </div>
            )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm flex items-center gap-1">
              {listing.seller.firstName} {listing.seller.lastName}
              {listing.seller.isVerified && (
                <CheckCircle size={14} className="text-primary flex-shrink-0" />
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {listing.seller.servingState} · Corps member
            </p>
          </div>
          <ArrowLeft size={16} className="text-muted-foreground rotate-180" />
        </div>
      </div>

      {/* CTA footer */}
      {!isOwner && isActive && (
        <div className="sticky bottom-0 bg-surface border-t border-border px-4 py-4">
          <button
            onClick={() => chatMutation.mutate()}
            disabled={chatMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            <MessageCircle size={18} />
            {chatMutation.isPending ? 'Opening chat…' : 'Chat with Seller'}
          </button>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm space-y-4 border border-border">
            <h3 className="font-bold text-foreground">Delete listing?</h3>
            <p className="text-sm text-muted-foreground">
              This will permanently remove your listing. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setDeleteConfirm(false); deleteMutation.mutate(); }}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-60 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
