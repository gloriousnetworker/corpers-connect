'use client';

import TopBar from './TopBar';
import BottomNav from './BottomNav';

// MobileShell is no longer used by AppShell (AppShell is now a unified shell).
// Kept for reference only.
export default function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface">
      <TopBar />
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
