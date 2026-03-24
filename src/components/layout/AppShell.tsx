'use client';

import TopBar from './TopBar';
import BottomNav from './BottomNav';
import SideNav from './SideNav';
import RightPanel from './RightPanel';

interface AppShellProps {
  children: React.ReactNode;
  topBarTitle?: string;
  showTopBarLogo?: boolean;
  topBarRight?: React.ReactNode;
}

/**
 * AppShell — Full-bleed 3-zone layout (Facebook/WhatsApp-style).
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  SideNav (256px) │  Main content (flex-1)  │  RightPanel    │
 * │  sticky, lg+     │  fills ALL space        │  320px, xl+    │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Mobile (<lg): fixed TopBar top + full-width content + fixed BottomNav bottom
 * Desktop (lg–xl): SideNav left + main content fills EVERYTHING to the right
 * Desktop (xl+): SideNav + main content + RightPanel suggestions panel
 *
 * Key rules:
 * - NO max-width on the main zone — pages control their own inner layout
 * - NO gray dead zones — the entire viewport is intentionally filled
 * - SideNav uses sticky (not fixed) so no margin-left hacks
 * - TopBar and BottomNav only exist on mobile (lg:hidden)
 */
export default function AppShell({
  children,
  topBarTitle,
  showTopBarLogo = true,
  topBarRight,
}: AppShellProps) {
  return (
    <div className="flex min-h-dvh bg-background">

      {/* ── Zone 1: Left sidebar ───────────────────────────────────── */}
      {/* Sticky, visible lg+ only. Height = viewport height. */}
      <SideNav />

      {/* ── Zone 2 + 3: Everything right of the sidebar ───────────── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Mobile-only fixed top bar */}
        <TopBar
          title={topBarTitle}
          showLogo={showTopBarLogo}
          rightSlot={topBarRight}
        />

        {/* Content row: main + optional right panel */}
        <div className="flex flex-1">

          {/* ── Zone 2: Main content ─────────────────────────────── */}
          {/*
            bg-surface (white) fills the full zone — no narrow column.
            Pages add their own max-width + padding for readability.
            On mobile, this is the only column (full width).
          */}
          <main className="flex-1 min-w-0 bg-surface">
            {children}
          </main>

          {/* ── Zone 3: Right panel (xl+ only) ───────────────────── */}
          {/*
            Sticky so it stays visible while the center content scrolls.
            Width: 320px. Left border separates it from the content zone.
          */}
          <aside className="hidden xl:block w-80 flex-shrink-0 sticky top-0 h-dvh overflow-y-auto border-l border-border bg-background px-4 py-5">
            <RightPanel />
          </aside>

        </div>

        {/* Mobile-only fixed bottom nav */}
        <BottomNav />

      </div>
    </div>
  );
}
