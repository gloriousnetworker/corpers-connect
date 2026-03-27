'use client';

import TopBar from './TopBar';
import BottomNav from './BottomNav';
import DesktopSideNav from './DesktopSideNav';
import RightPanel from './RightPanel';
import SocketInitializer from './SocketInitializer';
import NotificationPermissionBanner from './NotificationPermissionBanner';

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
      {/* Socket.IO connection for real-time messaging */}
      <SocketInitializer />

      {/* Mobile-only top bar — hidden on desktop via lg:hidden inside TopBar */}
      <TopBar />

      {/* Three-column flex row — h-dvh so the viewport is fully consumed and
          overflow is handled per-column; body/html are overflow:hidden so no
          page-level rubber-band bounce occurs on iOS/Android. */}
      <div className="flex h-dvh overflow-hidden">
        {/* Left sidebar: invisible on mobile, sticky flex column on desktop */}
        <DesktopSideNav />

        {/* Center: scrolls independently — overscroll-behavior:none kills bounce */}
        <main className="flex-1 min-w-0 overflow-y-auto overscroll-y-none bg-surface">
          {children}
        </main>

        {/* Right panel: xl+ only, scrolls independently */}
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-80 border-l border-border bg-surface overflow-y-auto overscroll-y-none">
          <div className="px-4 py-6">
            <RightPanel />
          </div>
        </aside>
      </div>

      {/* Mobile-only bottom nav — hidden on desktop via lg:hidden inside BottomNav */}
      <BottomNav />

      {/* Push-notification permission nudge — shows once for users who haven't decided */}
      <NotificationPermissionBanner />
    </>
  );
}
