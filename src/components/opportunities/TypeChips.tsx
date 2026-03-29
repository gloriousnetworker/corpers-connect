'use client';

import { OpportunityType } from '@/types/enums';

const TYPES: { value: OpportunityType | 'ALL'; label: string; emoji: string }[] = [
  { value: 'ALL',                      label: 'All',         emoji: '💡' },
  { value: OpportunityType.JOB,        label: 'Jobs',        emoji: '💼' },
  { value: OpportunityType.INTERNSHIP, label: 'Internships', emoji: '🎓' },
  { value: OpportunityType.VOLUNTEER,  label: 'Volunteer',   emoji: '🤝' },
  { value: OpportunityType.CONTRACT,   label: 'Contract',    emoji: '📋' },
  { value: OpportunityType.OTHER,      label: 'Other',       emoji: '🌐' },
];

interface TypeChipsProps {
  selected: OpportunityType | 'ALL';
  onChange: (type: OpportunityType | 'ALL') => void;
}

export default function TypeChips({ selected, onChange }: TypeChipsProps) {
  return (
    <div
      data-testid="type-chips"
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {TYPES.map((t) => {
        const active = selected === t.value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={[
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            ].join(' ')}
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { TYPES };
