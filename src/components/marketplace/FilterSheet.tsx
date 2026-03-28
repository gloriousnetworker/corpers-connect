'use client';

import { useState } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { ListingType, ListingCategory } from '@/types/enums';
import type { ListingFilters } from '@/lib/api/marketplace';
import PriceInput from './PriceInput';

const LIST_TYPES: { value: ListingType; label: string }[] = [
  { value: ListingType.FOR_SALE, label: 'For Sale' },
  { value: ListingType.FOR_RENT, label: 'For Rent' },
  { value: ListingType.SERVICE,  label: 'Service'  },
  { value: ListingType.FREE,     label: 'Free'     },
];

const CATEGORIES: { value: ListingCategory; label: string }[] = [
  { value: ListingCategory.HOUSING,      label: 'Housing'       },
  { value: ListingCategory.UNIFORM,      label: 'Uniform'       },
  { value: ListingCategory.ELECTRONICS,  label: 'Electronics'   },
  { value: ListingCategory.FOOD,         label: 'Food'          },
  { value: ListingCategory.SERVICES,     label: 'Services'      },
  { value: ListingCategory.OPPORTUNITIES,label: 'Opportunities' },
  { value: ListingCategory.OTHERS,       label: 'Others'        },
];

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: ListingFilters;
  onApply: (filters: ListingFilters) => void;
}

export default function FilterSheet({ open, onClose, filters, onApply }: FilterSheetProps) {
  const [local, setLocal] = useState<ListingFilters>(filters);

  if (!open) return null;

  const toggle = <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => {
    setLocal((prev) => ({
      ...prev,
      [key]: prev[key] === value ? undefined : value,
    }));
  };

  const apply = () => {
    onApply(local);
    onClose();
  };

  const reset = () => {
    setLocal({});
    onApply({});
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl border-t border-border max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface px-5 pt-5 pb-3 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-primary" />
            <h2 className="font-semibold text-foreground">Filters</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-6">
          {/* Listing type */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">Listing Type</h3>
            <div className="flex flex-wrap gap-2">
              {LIST_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => toggle('listingType', t.value)}
                  className={[
                    'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                    local.listingType === t.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-foreground border-border hover:bg-muted',
                  ].join(' ')}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* Category */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">Category</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => toggle('category', c.value)}
                  className={[
                    'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                    local.category === c.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-foreground border-border hover:bg-muted',
                  ].join(' ')}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </section>

          {/* Price range */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">Price Range</h3>
            <div className="flex gap-3">
              <PriceInput
                label="Min"
                value={local.minPrice != null ? String(local.minPrice) : ''}
                onChange={(v) => setLocal((p) => ({ ...p, minPrice: v ? Number(v) : undefined }))}
              />
              <PriceInput
                label="Max"
                value={local.maxPrice != null ? String(local.maxPrice) : ''}
                onChange={(v) => setLocal((p) => ({ ...p, maxPrice: v ? Number(v) : undefined }))}
              />
            </div>
          </section>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-surface px-5 py-4 border-t border-border flex gap-3">
          <button
            onClick={reset}
            className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            Reset
          </button>
          <button
            onClick={apply}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
