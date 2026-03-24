'use client';

import TopBar from './TopBar';
import BottomNav from './BottomNav';

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
      <TopBar
        title={topBarTitle}
        showLogo={showTopBarLogo}
        rightSlot={topBarRight}
      />
      <main className="content-area">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
