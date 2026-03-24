import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home | Corpers Connect',
};

export default function FeedPage() {
  return (
    <div className="pt-bar pb-nav min-h-dvh">
      {/* Narrow readable column for feed content — same treatment Phase 2 posts will use */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* TODO Phase 2: stories tray */}
        {/* TODO Phase 2: feed list */}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-3xl">🏡</span>
          </div>
          <p className="text-lg font-semibold text-foreground">Your feed is ready!</p>
          <p className="text-sm text-foreground-secondary mt-1">Phase 2 — Feed &amp; Posts — coming next.</p>
        </div>
      </div>
    </div>
  );
}
