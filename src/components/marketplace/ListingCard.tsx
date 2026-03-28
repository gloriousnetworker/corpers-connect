'use client';

import Image from 'next/image';
import { MapPin, Eye } from 'lucide-react';
import type { MarketplaceListing } from '@/types/models';
import { ListingType, ListingStatus } from '@/types/enums';

interface ListingCardProps {
  listing: MarketplaceListing;
  onClick: (listing: MarketplaceListing) => void;
}

const TYPE_BADGE: Record<ListingType, { label: string; cls: string }> = {
  [ListingType.FOR_SALE]:  { label: 'For Sale',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  [ListingType.FOR_RENT]:  { label: 'For Rent',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  [ListingType.SERVICE]:   { label: 'Service',   cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  [ListingType.FREE]:      { label: 'Free',      cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
};

export default function ListingCard({ listing, onClick }: ListingCardProps) {
  const badge = TYPE_BADGE[listing.listingType];
  const isSold = listing.status === ListingStatus.SOLD;

  return (
    <button
      data-testid="listing-card"
      onClick={() => onClick(listing)}
      className="group relative flex flex-col rounded-xl border border-border bg-surface overflow-hidden text-left transition-shadow hover:shadow-md active:scale-[0.98]"
    >
      {/* Image */}
      <div className="relative aspect-square w-full bg-muted overflow-hidden">
        {listing.images[0] ? (
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-muted-foreground/30">
            📦
          </div>
        )}

        {/* Sold overlay */}
        {isSold && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-wider">SOLD</span>
          </div>
        )}

        {/* Boost badge */}
        {listing.isBoost && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            ⚡ BOOST
          </span>
        )}

        {/* Type badge */}
        <span className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
          {listing.title}
        </p>

        {listing.price != null ? (
          <p className="text-base font-bold text-primary">
            ₦{listing.price.toLocaleString('en-NG')}
          </p>
        ) : (
          <p className="text-base font-bold text-amber-500">Free</p>
        )}

        <div className="flex items-center justify-between mt-1">
          {listing.location && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin size={10} />
              <span className="truncate max-w-[80px]">{listing.location}</span>
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
            <Eye size={10} />
            {listing.viewCount}
          </span>
        </div>
      </div>
    </button>
  );
}
