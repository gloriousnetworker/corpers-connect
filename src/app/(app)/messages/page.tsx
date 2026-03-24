import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Messages | Corpers Connect' };

export default function MessagesPage() {
  return (
    <div className="pt-bar pb-nav px-4 py-8 text-center">
      <p className="text-lg font-semibold text-foreground">Messages</p>
      <p className="text-sm text-foreground-secondary mt-1">Phase 4 — coming soon.</p>
    </div>
  );
}
