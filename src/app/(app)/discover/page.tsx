import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Discover | Corpers Connect' };

export default function DiscoverPage() {
  return (
    <div className="pt-bar pb-nav px-4 py-8 text-center">
      <p className="text-lg font-semibold text-foreground">Discover</p>
      <p className="text-sm text-foreground-secondary mt-1">Phase 2 — coming next.</p>
    </div>
  );
}
