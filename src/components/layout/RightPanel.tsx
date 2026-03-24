'use client';

import { Users, TrendingUp, Zap } from 'lucide-react';

/**
 * Right sidebar panel — visible on xl+ screens.
 * Phase 1: placeholder cards. Phase 2+ will populate with real data.
 */
export default function RightPanel() {
  return (
    <div className="space-y-5">
      {/* Suggested connections */}
      <div className="bg-surface-alt rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Suggested Corpers</h3>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <div className="w-9 h-9 rounded-full bg-surface-alt border border-border flex-shrink-0 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-border rounded w-24 animate-pulse" />
              <div className="h-2.5 bg-border rounded w-16 animate-pulse" />
            </div>
          </div>
        ))}
        <button className="mt-1 text-xs text-primary font-medium hover:underline">
          See more
        </button>
      </div>

      {/* Trending topics */}
      <div className="bg-surface-alt rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Trending in NYSC</h3>
        </div>
        {['#NYSCBatch2025', '#CorperWoes', '#CampLife', '#PPA'].map((tag) => (
          <div key={tag} className="py-2 border-b border-border/60 last:border-0">
            <p className="text-sm font-medium text-foreground">{tag}</p>
            <p className="text-xs text-foreground-muted mt-0.5">Trending</p>
          </div>
        ))}
      </div>

      {/* Phase notice */}
      <div className="bg-primary/8 rounded-2xl p-4 flex gap-2.5">
        <Zap className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-foreground-secondary leading-relaxed">
          More features coming in Phase 2 — stories, posts, live feed & more.
        </p>
      </div>
    </div>
  );
}
