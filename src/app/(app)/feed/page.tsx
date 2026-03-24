import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home | Corpers Connect',
};

export default function FeedPage() {
  return (
    <div className="pt-bar pb-nav content-area">
      <div className="px-4 py-4 space-y-4">
        {/* TODO Phase 2: stories tray */}
        {/* TODO Phase 2: feed list */}
        <div className="text-center py-16 text-foreground-secondary">
          <p className="text-lg font-semibold text-foreground">Your feed is ready!</p>
          <p className="text-sm mt-1">Phase 2 — Feed & Posts — coming next.</p>
        </div>
      </div>
    </div>
  );
}
