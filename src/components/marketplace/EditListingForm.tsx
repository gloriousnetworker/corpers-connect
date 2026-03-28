'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateListing } from '@/lib/api/marketplace';
import { useMarketplaceStore } from '@/store/marketplace.store';
import { ListingCategory, ListingStatus, ListingType } from '@/types/enums';
import PriceInput from './PriceInput';

const CATEGORIES = [
  { value: ListingCategory.HOUSING,      label: '🏠 Housing'       },
  { value: ListingCategory.UNIFORM,      label: '👔 Uniform'       },
  { value: ListingCategory.ELECTRONICS,  label: '📱 Electronics'   },
  { value: ListingCategory.FOOD,         label: '🍽️ Food'          },
  { value: ListingCategory.SERVICES,     label: '🔧 Services'      },
  { value: ListingCategory.OPPORTUNITIES,label: '💼 Opportunities' },
  { value: ListingCategory.OTHERS,       label: '📦 Others'        },
];

const LIST_TYPES = [
  { value: ListingType.FOR_SALE, label: 'For Sale' },
  { value: ListingType.FOR_RENT, label: 'For Rent' },
  { value: ListingType.SERVICE,  label: 'Service'  },
  { value: ListingType.FREE,     label: 'Free'     },
];

const STATUSES = [
  { value: ListingStatus.ACTIVE,   label: 'Active'   },
  { value: ListingStatus.SOLD,     label: 'Sold'     },
  { value: ListingStatus.INACTIVE, label: 'Inactive' },
];

export default function EditListingForm() {
  const qc = useQueryClient();
  const { selectedListing, goBack, selectListing } = useMarketplaceStore();

  const [title, setTitle]             = useState(selectedListing?.title ?? '');
  const [description, setDescription] = useState(selectedListing?.description ?? '');
  const [category, setCategory]       = useState<ListingCategory>(selectedListing?.category ?? ListingCategory.OTHERS);
  const [listingType, setListingType] = useState<ListingType>(selectedListing?.listingType ?? ListingType.FOR_SALE);
  const [price, setPrice]             = useState(selectedListing?.price != null ? String(selectedListing.price) : '');
  const [location, setLocation]       = useState(selectedListing?.location ?? '');
  const [status, setStatus]           = useState<ListingStatus>(selectedListing?.status ?? ListingStatus.ACTIVE);

  const mutation = useMutation({
    mutationFn: () =>
      updateListing(selectedListing!.id, {
        title,
        description,
        category,
        listingType,
        price: listingType !== ListingType.FREE && price ? Number(price) : undefined,
        location: location || undefined,
        status,
      }),
    onSuccess: (updated) => {
      toast.success('Listing updated!');
      qc.invalidateQueries({ queryKey: ['marketplace'] });
      selectListing(updated);
    },
    onError: (err: Error) => toast.error(err.message ?? 'Failed to update listing'),
  });

  const isFree = listingType === ListingType.FREE;

  if (!selectedListing) {
    goBack();
    return null;
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="text-foreground hover:text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-foreground text-lg flex-1">Edit Listing</h1>
      </div>

      <div className="px-4 py-5 space-y-5 flex-1">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-foreground">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Status</label>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={[
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  status === s.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-foreground border-border hover:bg-muted',
                ].join(' ')}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listing type */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Type</label>
          <div className="flex gap-2 flex-wrap">
            {LIST_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => { setListingType(t.value); if (t.value === ListingType.FREE) setPrice(''); }}
                className={[
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  listingType === t.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-foreground border-border hover:bg-muted',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Category</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={[
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  category === c.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-foreground border-border hover:bg-muted',
                ].join(' ')}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        {!isFree && (
          <PriceInput value={price} onChange={setPrice} label="Price (₦)" />
        )}

        {/* Location */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-foreground">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={2000}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="sticky bottom-0 bg-surface border-t border-border px-4 py-4">
        <button
          onClick={() => mutation.mutate()}
          disabled={!title.trim() || !description.trim() || mutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending && <Loader2 size={18} className="animate-spin" />}
          {mutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
