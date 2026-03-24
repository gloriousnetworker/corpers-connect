'use client';

import MobileShell from './MobileShell';
import DesktopShell from './DesktopShell';

interface AppShellProps {
  children: React.ReactNode;
  topBarTitle?: string;
  showTopBarLogo?: boolean;
  topBarRight?: React.ReactNode;
}

/**
 * AppShell — CSS-driven layout switcher.
 *
 * Below lg  → MobileShell (PWA-style: fixed top/bottom bars, scrolling content)
 * lg and up → DesktopShell (full-viewport 3-column web app, no page-level scroll)
 *
 * Pure CSS visibility — no JS/hydration issues. Both render on the server;
 * the browser hides whichever doesn't apply.
 */
export default function AppShell({
  children,
  topBarTitle,
  showTopBarLogo = true,
  topBarRight,
}: AppShellProps) {
  return (
    <>
      {/* Mobile layout — hidden on lg+ */}
      <div className="lg:hidden">
        <MobileShell
          topBarTitle={topBarTitle}
          showTopBarLogo={showTopBarLogo}
          topBarRight={topBarRight}
        >
          {children}
        </MobileShell>
      </div>

      {/* Desktop layout — hidden below lg, fills full viewport */}
      <div className="hidden lg:flex h-dvh w-full overflow-hidden">
        <DesktopShell>{children}</DesktopShell>
      </div>
    </>
  );
}
