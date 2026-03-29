'use client';

import { Home, Compass, ShoppingBag, Briefcase, MessageCircle, User, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, type ActiveSection } from '@/store/ui.store';

interface NavItem {
  section: ActiveSection;
  icon: LucideIcon;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { section: 'feed',        icon: Home,          label: 'Home'    },
  { section: 'discover',    icon: Compass,       label: 'Discover'},
  { section: 'marketplace',   icon: ShoppingBag,   label: 'Market'  },
  { section: 'opportunities', icon: Briefcase,     label: 'Jobs'    },
  { section: 'messages',      icon: MessageCircle, label: 'Messages'},
  { section: 'profile',     icon: User,          label: 'Profile' },
];

export default function BottomNav() {
  const { activeSection, setActiveSection, unreadMessages } = useUIStore();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map(({ section, icon: Icon, label }) => {
          const active = activeSection === section;
          const showBadge = section === 'messages' && unreadMessages > 0;

          return (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className="flex flex-col items-center justify-center gap-0.5 p-2 min-w-[48px] touch-manipulation"
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'h-[22px] w-[22px] transition-colors',
                    active ? 'text-primary' : 'text-foreground-muted',
                  )}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-foreground-muted',
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
