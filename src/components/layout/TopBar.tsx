'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

interface TopBarProps {
  title?: string;
  showLogo?: boolean;
  rightSlot?: React.ReactNode;
  className?: string;
}

export default function TopBar({
  title,
  showLogo = false,
  rightSlot,
  className,
}: TopBarProps) {
  const { unreadNotifications } = useUIStore();

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-border lg:hidden',
        'pt-[env(safe-area-inset-top)]',
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        {/* Left: Logo or title */}
        <div className="flex-1">
          {showLogo ? (
            <Logo size="sm" />
          ) : title ? (
            <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
          ) : null}
        </div>

        {/* Right: notifications + optional slot */}
        <div className="flex items-center gap-1">
          {rightSlot}
          <Link
            href="/notifications"
            className="relative p-2 touch-manipulation"
            aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ''}`}
          >
            <Bell className="h-[22px] w-[22px] text-foreground-muted" strokeWidth={1.8} />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
