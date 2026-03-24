import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Profile | Corpers Connect' };

export default function ProfilePage() {
  return (
    <div className="pt-bar pb-nav px-4 py-8 text-center">
      <p className="text-lg font-semibold text-foreground">Profile</p>
      <p className="text-sm text-foreground-secondary mt-1">Phase 6 — coming soon.</p>
    </div>
  );
}
