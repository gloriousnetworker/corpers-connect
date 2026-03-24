'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  MessageCircle,
  User,
  Bell,
  PlusSquare,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/feed',          icon: Home,          label: 'Home'          },
  { href: '/discover',      icon: Compass,       label: 'Discover'      },
  { href: '/notifications', icon: Bell,          label: 'Notifications' },
  { href: '/messages',      icon: MessageCircle, label: 'Messages'      },
  { href: '/profile',       icon: User,          label: 'Profile'       },
];

/**
 * DesktopSideNav — left sidebar for the desktop shell.
 * Lives inside a h-dvh overflow-hidden flex container, so it fills full height
 * and scrolls independently. No sticky hacks needed.
 */
export default function DesktopSideNav() {
  const pathname = usePathname();
  const { unreadMessages, unreadNotifications, setCreatePostOpen } = useUIStore();

  return (
    <aside className="w-64 xl:w-72 flex-shrink-0 h-full flex flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <Link href="/feed" className="flex items-center px-2">
          <div className="relative h-12 w-48">
            <Image
              src="/corpersconnectlogo.jpg"
              alt="Corpers Connect"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Nav links — scrollable if many items */}
      <nav className="flex-1 px-4 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const badge =
            label === 'Messages'      ? unreadMessages :
            label === 'Notifications' ? unreadNotifications : 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-medium transition-colors',
                active
                  ? 'text-primary bg-primary/10'
                  : 'text-foreground hover:bg-surface-alt',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative flex-shrink-0">
                <Icon
                  className={cn(
                    'h-[22px] w-[22px]',
                    active ? 'text-primary' : 'text-foreground-secondary',
                  )}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Create Post button pinned to bottom */}
      <div className="px-4 py-5 flex-shrink-0">
        <button
          onClick={() => setCreatePostOpen(true)}
          className="w-full bg-primary text-white rounded-xl py-3.5 font-semibold text-[15px] hover:bg-primary-dark active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <PlusSquare className="h-5 w-5" />
          Create Post
        </button>
      </div>
    </aside>
  );
}
