'use client';

import TopBar from './TopBar';
import BottomNav from './BottomNav';
import SideNav from './SideNav';

interface AppShellProps {
  children: React.ReactNode;
  topBarTitle?: string;
  showTopBarLogo?: boolean;
  topBarRight?: React.ReactNode;
}

/**
 * AppShell — responsive layout wrapper.
 *
 * Mobile  (<lg): fixed TopBar top + scrollable content + fixed BottomNav bottom
 * Desktop (lg+): sticky sidebar left + content column (max 640px, border-r) + empty right
 *
 * Key: sidebar uses `sticky top-0 h-dvh` inside a flex row — no position:fixed or
 * margin-left hacks needed. Sidebar stays visible as the right column scrolls.
 */
export default function AppShell({
  children,
  topBarTitle,
  showTopBarLogo = true,
  topBarRight,
}: AppShellProps) {
  return (
    /* Root — flex row on lg+, stacked column on mobile */
    <div className="flex min-h-dvh bg-background">

      {/* ── Desktop sidebar (sticky, not fixed) ───────────────────────── */}
      <SideNav />

      {/* ── Right of sidebar: mobile bars + content ───────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Mobile top bar (fixed, hidden lg+) */}
        <TopBar
          title={topBarTitle}
          showLogo={showTopBarLogo}
          rightSlot={topBarRight}
        />

        {/* Main content column */}
        <main className="flex-1">
          {/*
            On mobile: full width, the page itself adds pt-bar + pb-nav padding.
            On desktop: left-aligned 640px column with a right border — Twitter style.
            The column has white bg; area to its right stays bg-background (light gray).
          */}
          <div className="w-full bg-surface lg:max-w-[640px] lg:border-r lg:border-border lg:min-h-dvh">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav (fixed, hidden lg+) */}
        <BottomNav />
      </div>
    </div>
  );
}
