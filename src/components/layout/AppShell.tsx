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

export default function AppShell({
  children,
  topBarTitle,
  showTopBarLogo = true,
  topBarRight,
}: AppShellProps) {
  return (
    <>
      {/* Desktop sidebar — visible only lg+ */}
      <SideNav />

      {/* Mobile top bar — hidden on lg+ */}
      <TopBar
        title={topBarTitle}
        showLogo={showTopBarLogo}
        rightSlot={topBarRight}
      />

      {/* Main content — offset right of sidebar on desktop.
          On desktop: left-aligned column (Twitter-style), white bg,
          subtle right border. Right of the column stays bg-background. */}
      <main className="content-area lg:ml-64 xl:ml-72">
        <div className="min-h-dvh bg-surface lg:max-w-[680px] lg:border-r lg:border-border">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav — hidden on lg+ */}
      <BottomNav />
    </>
  );
}
