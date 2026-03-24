'use client';

import { Search } from 'lucide-react';

const CATEGORIES = [
  { emoji: '🗺️', label: 'By State' },
  { emoji: '🏕️', label: 'Camp Life' },
  { emoji: '💼', label: 'PPA' },
  { emoji: '📚', label: 'Skills' },
  { emoji: '🎉', label: 'Events' },
  { emoji: '💬', label: 'Topics' },
];

export default function DiscoverSection() {
  return (
    <div className="max-w-[680px] mx-auto px-4 space-y-4">
      {/* Search bar */}
      <div className="bg-surface rounded-2xl border border-border shadow-card p-3">
        <div className="flex items-center gap-3 px-3 py-2.5 bg-surface-alt rounded-xl">
          <Search className="w-4 h-4 text-foreground-muted flex-shrink-0" />
          <input
            type="search"
            placeholder="Search corpers, states, topics..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted text-foreground"
            readOnly
          />
        </div>
      </div>

      {/* Categories grid */}
      <div className="bg-surface rounded-2xl border border-border shadow-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Browse by Category</h3>
        <div className="grid grid-cols-3 gap-3">
          {CATEGORIES.map(({ emoji, label }) => (
            <button
              key={label}
              className="flex flex-col items-center gap-2 py-5 rounded-xl bg-surface-alt hover:bg-primary/8 transition-colors"
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-medium text-foreground-secondary">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Phase 2 notice */}
      <div className="bg-surface rounded-2xl border border-border shadow-card p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">🔍</span>
        </div>
        <p className="font-semibold text-foreground">Full Discover coming in Phase 2</p>
        <p className="text-sm text-foreground-secondary mt-1">
          Find corpers in your state, PPA, camp and more.
        </p>
      </div>
    </div>
  );
}
