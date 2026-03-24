'use client';

import TopBar from './TopBar';
import BottomNav from './BottomNav';
import DesktopSideNav from './DesktopSideNav';
import RightPanel from './RightPanel';

/**
 * AppShell — single-render layout shell for the authenticated SPA dashboard.
 *
 * Mobile  (< lg): fixed TopBar + fixed BottomNav + body-scrolling content
 * Desktop (≥ lg): fixed left sidebar (w-64) + fixed right panel (xl+, w-80)
 *                 + center zone that has its OWN scroll (h-dvh overflow-y-auto)
 *                 → sidebar and right panel never scroll with content
 *
 * Children render ONCE. URL stays at "/" always (SPA nav via Zustand).
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────── */}
      <TopBar />

      {/* ── Desktop left sidebar ───────────────────────── */}
      <DesktopSideNav />

      {/* ── Desktop right panel (xl+) ──────────────────── */}
      <aside className="hidden xl:flex flex-col fixed right-0 inset-y-0 w-80 border-l border-border bg-surface overflow-y-auto z-30">
        <div className="px-4 py-6">
          <RightPanel />
        </div>
      </aside>

      {/* ── Main content area ──────────────────────────── */}
      {/*
          Mobile:  min-h-dvh, body scrolls naturally (pt-bar/pb-nav handle bar clearance)
          Desktop: h-dvh overflow-y-auto so ONLY the center scrolls independently.
                   lg:ml-64 shifts past the sidebar, xl:mr-80 shifts before right panel.
      */}
      <main
        className={[
          'bg-surface-elevated',
          // Mobile: full-height, body scrolls
          'min-h-dvh',
          // Desktop: fill viewport exactly, own scroll, shift for fixed panels
          'lg:min-h-0 lg:h-dvh lg:overflow-y-auto',
          'lg:ml-64 xl:mr-80',
        ].join(' ')}
      >
        {children}
      </main>

      {/* ── Mobile bottom nav ──────────────────────────── */}
      <BottomNav />
    </>
  );
}
