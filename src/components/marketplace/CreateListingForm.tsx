'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Camera, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createListing } from '@/lib/api/marketplace';
import { useMarketplaceStore } from '@/store/marketplace.store';
import { ListingCategory, ListingType } from '@/types/enums';
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

const MAX_IMAGES = 5;

export default function CreateListingForm() {
  const qc = useQueryClient();
  const { goBack, setView } = useMarketplaceStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]     = useState<ListingCategory>(ListingCategory.OTHERS);
  const [listingType, setListingType] = useState<ListingType>(ListingType.FOR_SALE);
  const [price, setPrice]           = useState('');
  const [location, setLocation]     = useState('');
  const [images, setImages]         = useState<File[]>([]);
  const [previews, setPreviews]     = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: () =>
      createListing({ title, description, category, listingType, images, location: location || undefined,
        price: price ? Number(price) : undefined }),
    onSuccess: (listing) => {
      toast.success('Listing created!');
      qc.invalidateQueries({ queryKey: ['marketplace'] });
      useMarketplaceStore.getState().selectListing(listing);
    },
    onError: (err: Error) => toast.error(err.message ?? 'Failed to create listing'),
  });

  const addImages = (files: FileList) => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Max ${MAX_IMAGES} images`);
      return;
    }
    const toAdd = Array.from(files).slice(0, remaining);
    setImages((prev) => [...prev, ...toAdd]);
    toAdd.forEach((f) => {
      const url = URL.createObjectURL(f);
      setPreviews((prev) => [...prev, url]);
    });
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const isFree = listingType === ListingType.FREE;
  const canSubmit = title.trim().length >= 3 && description.trim().length >= 10 && images.length > 0;

  function validate(): string | null {
    if (!title.trim()) return 'Please enter a title for your listing.';
    if (title.trim().length < 3) return 'Title is too short — please enter at least 3 characters.';
    if (!description.trim()) return 'Please add a description.';
    if (description.trim().length < 10) return 'Description is too short — please write at least 10 characters.';
    if (images.length === 0) return 'Please add at least one photo.';
    if (!isFree && price && Number(price) <= 0) return 'Price must be greater than zero.';
    return null;
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="text-foreground hover:text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-foreground text-lg flex-1">New Listing</h1>
      </div>

      <div className="px-4 py-5 space-y-5 flex-1">
        {/* Image picker */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Photos <span className="text-muted-foreground font-normal">({images.length}/{MAX_IMAGES})</span>
          </label>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {previews.map((src, i) => (
              <div key={i} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`preview ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-muted transition-colors"
              >
                <Camera size={22} />
                <span className="text-[11px]">Add photo</span>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addImages(e.target.files)}
          />
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-foreground">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="What are you selling?"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
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
          <PriceInput
            value={price}
            onChange={setPrice}
            label="Price (₦)"
            placeholder="0"
          />
        )}

        {/* Location */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-foreground">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Calabar, Cross River"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-foreground">
            Description <span className="text-destructive">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your item or service in detail…"
            rows={4}
            maxLength={2000}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
        </div>
      </div>

      {/* Submit */}
      <div className="sticky bottom-0 bg-surface border-t border-border px-4 py-4">
        <button
          onClick={() => {
            const err = validate();
            if (err) { toast.error(err); return; }
            mutation.mutate();
          }}
          disabled={mutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending && <Loader2 size={18} className="animate-spin" />}
          {mutation.isPending ? 'Creating…' : 'Post Listing'}
        </button>
      </div>
    </div>
  );
}
