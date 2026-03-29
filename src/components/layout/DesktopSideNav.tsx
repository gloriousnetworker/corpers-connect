'use client';

import Image from 'next/image';
import {
  Home,
  Compass,
  Bell,
  Briefcase,
  MessageCircle,
  User,
  PlusSquare,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, type ActiveSection } from '@/store/ui.store';

interface NavItem {
  section: ActiveSection;
  icon: LucideIcon;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { section: 'feed',          icon: Home,          label: 'Home'          },
  { section: 'discover',      icon: Compass,       label: 'Discover'      },
  { section: 'marketplace',   icon: ShoppingBag,   label: 'Mami Market'   },
  { section: 'opportunities', icon: Briefcase,     label: 'Opportunities' },
  { section: 'notifications', icon: Bell,          label: 'Notifications' },
  { section: 'messages',      icon: MessageCircle, label: 'Messages'      },
  { section: 'profile',       icon: User,          label: 'Profile'       },
];

export default function DesktopSideNav() {
  const { activeSection, setActiveSection, unreadMessages, unreadNotifications, setCreatePostOpen } =
    useUIStore();

  return (
    <aside className="hidden lg:flex flex-col flex-shrink-0 w-64 border-r border-border bg-surface overflow-y-auto sticky top-0 h-dvh">
      {/* Logo */}
      <div className="px-5 pt-6 pb-3 flex-shrink-0">
        <button onClick={() => setActiveSection('feed')} className="block">
          <div className="relative h-12 w-48">
            <Image
              src="/corpersconnectlogo.jpg"
              alt="Corpers Connect"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ section, icon: Icon, label }) => {
          const active = activeSection === section;
          const badge =
            section === 'messages'      ? unreadMessages :
            section === 'notifications' ? unreadNotifications : 0;

          return (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={cn(
                'w-full flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-medium transition-colors',
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
            </button>
          );
        })}
      </nav>

      {/* Create Post button */}
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
