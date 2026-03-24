'use client';

import TopBar from './TopBar';
import BottomNav from './BottomNav';
import DesktopSideNav from './DesktopSideNav';
import RightPanel from './RightPanel';

interface AppShellProps {
  children: React.ReactNode;
  topBarTitle?: string;
  showTopBarLogo?: boolean;
  topBarRight?: React.ReactNode;
}

/**
 * AppShell — single-render layout that adapts for mobile and desktop via CSS.
 *
 * Mobile (< lg):
 *   - Fixed TopBar at top
 *   - Fixed BottomNav at bottom
 *   - Content fills between (pages use pt-bar + pb-nav to avoid overlap)
 *
 * Desktop (lg+):
 *   - Fixed left sidebar (DesktopSideNav, w-64, z-40)
 *   - Content shifts right with ml-64
 *   - Fixed right panel (xl+, w-80) — content also shifts with xl:mr-80
 *   - TopBar and BottomNav are hidden (lg:hidden)
 *
 * Children render ONCE — no hydration issues, no duplicate mounts.
 */
export default function AppShell({
  children,
  topBarTitle,
  showTopBarLogo = true,
  topBarRight,
}: AppShellProps) {
  return (
    <>
      {/* Mobile top bar — fixed, hidden on desktop */}
      <TopBar
        title={topBarTitle}
        showLogo={showTopBarLogo}
        rightSlot={topBarRight}
      />

      {/* Desktop sidebar — fixed left, hidden on mobile */}
      <DesktopSideNav />

      {/* Desktop right panel — fixed right, xl+ only */}
      <aside className="hidden xl:flex flex-col fixed right-0 inset-y-0 w-80 border-l border-border bg-surface overflow-y-auto z-30">
        <div className="px-4 py-5">
          <RightPanel />
        </div>
      </aside>

      {/* Main content — single render, shifts with fixed panels on desktop */}
      <main className="min-h-dvh bg-surface-elevated lg:ml-64 xl:mr-80">
        {children}
      </main>

      {/* Mobile bottom nav — fixed, hidden on desktop */}
      <BottomNav />
    </>
  );
}
