'use client';

import TopBar from './TopBar';
import BottomNav from './BottomNav';
import DesktopSideNav from './DesktopSideNav';
import RightPanel from './RightPanel';

/**
 * AppShell — single-render layout shell for the authenticated SPA dashboard.
 *
 * Mobile  (< lg): fixed TopBar + fixed BottomNav, body scrolls freely.
 *                 DesktopSideNav is hidden (display:none).
 *                 BottomNav handles all mobile navigation.
 *
 * Desktop (≥ lg): flex row — sticky sidebar (w-64) | scrollable center (flex-1) | sticky right panel (xl, w-80).
 *                 No manual margin shifts; flex naturally fills available space.
 *
 * The root layout no longer wraps in .app-container so the full viewport is available.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mobile-only top bar — hidden on desktop via lg:hidden inside TopBar */}
      <TopBar />

      {/* Three-column flex row */}
      <div className="flex min-h-dvh">
        {/* Left sidebar: invisible on mobile, sticky flex column on desktop */}
        <DesktopSideNav />

        {/* Center: fills all remaining space */}
        <main className="flex-1 min-w-0 bg-surface">
          {children}
        </main>

        {/* Right panel: xl+ only, sticky */}
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-80 border-l border-border bg-surface sticky top-0 h-dvh overflow-y-auto">
          <div className="px-4 py-6">
            <RightPanel />
          </div>
        </aside>
      </div>

      {/* Mobile-only bottom nav — hidden on desktop via lg:hidden inside BottomNav */}
      <BottomNav />
    </>
  );
}
