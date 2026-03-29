'use client';

import { Bell, ArrowLeft } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

const SECTION_TITLES: Record<string, string> = {
  feed:          'Home',
  discover:      'Discover',
  notifications: 'Notifications',
  messages:      'Messages',
  profile:       'Profile',
  userProfile:   'Profile',
  marketplace:   'Mami Market',
  opportunities: 'Opportunities',
  subscriptions: 'Corper Plus',
};

export default function TopBar({ className }: { className?: string }) {
  const { activeSection, setActiveSection, previousSection, unreadNotifications } = useUIStore();
  const showLogo = activeSection === 'feed';
  const showBack = activeSection === 'userProfile';

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-border lg:hidden',
        'pt-[env(safe-area-inset-top)]',
        className,
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        {/* Left: back on userProfile, logo on feed, title elsewhere */}
        <div className="flex-1 flex items-center gap-2">
          {showBack ? (
            <button
              onClick={() => setActiveSection(previousSection)}
              className="flex items-center gap-1.5 -ml-1 p-1 text-foreground-muted hover:text-foreground transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : null}
          {showLogo ? (
            <Logo size="sm" />
          ) : (
            <h1 className="text-base font-semibold text-foreground">
              {SECTION_TITLES[activeSection] ?? 'Corpers Connect'}
            </h1>
          )}
        </div>

        {/* Right: bell always visible (taps into notifications section) */}
        <button
          onClick={() => setActiveSection('notifications')}
          className="relative p-2 touch-manipulation"
          aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ''}`}
        >
          <Bell className="h-[22px] w-[22px] text-foreground-muted" strokeWidth={1.8} />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
              {unreadNotifications > 99 ? '99+' : unreadNotifications}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
