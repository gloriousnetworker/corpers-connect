'use client';

import TopBar from './TopBar';
import BottomNav from './BottomNav';

interface MobileShellProps {
  children: React.ReactNode;
  topBarTitle?: string;
  showTopBarLogo?: boolean;
  topBarRight?: React.ReactNode;
}

/**
 * MobileShell — PWA/mobile layout.
 * Fixed TopBar at top, fixed BottomNav at bottom, scrollable content fills between.
 * Pages use pt-bar + pb-nav to avoid being hidden behind the fixed bars.
 */
export default function MobileShell({
  children,
  topBarTitle,
  showTopBarLogo = true,
  topBarRight,
}: MobileShellProps) {
  return (
    <div className="min-h-dvh bg-surface">
      <TopBar
        title={topBarTitle}
        showLogo={showTopBarLogo}
        rightSlot={topBarRight}
      />
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
