import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Notifications | Corpers Connect' };

export default function NotificationsPage() {
  return (
    <div className="pt-bar pb-nav px-4 py-8 text-center">
      <p className="text-lg font-semibold text-foreground">Notifications</p>
      <p className="text-sm text-foreground-secondary mt-1">Phase 5 — coming soon.</p>
    </div>
  );
}
