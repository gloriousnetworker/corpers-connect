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

      {/* Main content — offset right of sidebar on desktop */}
      <main className="content-area lg:ml-64 xl:ml-72">
        <div className="w-full lg:max-w-2xl lg:mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav — hidden on lg+ */}
      <BottomNav />
    </>
  );
}
