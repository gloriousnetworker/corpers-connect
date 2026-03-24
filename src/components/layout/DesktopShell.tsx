'use client';

import DesktopSideNav from './DesktopSideNav';
import RightPanel from './RightPanel';

interface DesktopShellProps {
  children: React.ReactNode;
}

/**
 * DesktopShell — full-viewport 3-column web app layout.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  DesktopSideNav    │   Center content (own scroll)  │  RightPanel   │
 * │  w-64/72           │   flex-1, overflow-y-auto      │  w-80, xl+    │
 * │  h-full            │                                │  h-full       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Root is h-dvh overflow-hidden — the viewport is locked. Each zone scrolls
 * independently. No page-level scroll, no sticky hacks, no dead gray zones.
 * Covers the full screen on every desktop resolution.
 */
export default function DesktopShell({ children }: DesktopShellProps) {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">

      {/* Zone 1: Left sidebar */}
      <DesktopSideNav />

      {/* Zone 2: Center content — fills all remaining space, own scroll */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto bg-surface desktop-main">
        {children}
      </main>

      {/* Zone 3: Right panel — xl+ only, own scroll */}
      <aside className="hidden xl:flex flex-col w-80 flex-shrink-0 h-full overflow-y-auto border-l border-border bg-background">
        <div className="px-4 py-5">
          <RightPanel />
        </div>
      </aside>

    </div>
  );
}
