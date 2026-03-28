'use client';

import { ListingCategory } from '@/types/enums';

const CATEGORIES: { value: ListingCategory | 'ALL'; label: string; emoji: string }[] = [
  { value: 'ALL',                       label: 'All',          emoji: '🛒' },
  { value: ListingCategory.HOUSING,     label: 'Housing',      emoji: '🏠' },
  { value: ListingCategory.UNIFORM,     label: 'Uniform',      emoji: '👔' },
  { value: ListingCategory.ELECTRONICS, label: 'Electronics',  emoji: '📱' },
  { value: ListingCategory.FOOD,        label: 'Food',         emoji: '🍽️' },
  { value: ListingCategory.SERVICES,    label: 'Services',     emoji: '🔧' },
  { value: ListingCategory.OPPORTUNITIES, label: 'Opportunities', emoji: '💼' },
  { value: ListingCategory.OTHERS,      label: 'Others',       emoji: '📦' },
];

interface CategoryChipsProps {
  selected: ListingCategory | 'ALL';
  onChange: (cat: ListingCategory | 'ALL') => void;
}

export default function CategoryChips({ selected, onChange }: CategoryChipsProps) {
  return (
    <div
      data-testid="category-chips"
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {CATEGORIES.map((cat) => {
        const active = selected === cat.value;
        return (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value)}
            className={[
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            ].join(' ')}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { CATEGORIES };
