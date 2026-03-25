'use client';

import { useUIStore } from '@/store/ui.store';
import FeedSection from '@/components/sections/FeedSection';
import DiscoverSection from '@/components/sections/DiscoverSection';
import NotificationsSection from '@/components/sections/NotificationsSection';
import MessagesSection from '@/components/sections/MessagesSection';
import ProfileSection from '@/components/sections/ProfileSection';
import UserProfileSection from '@/components/sections/UserProfileSection';
import type { ActiveSection } from '@/store/ui.store';
import type { ComponentType } from 'react';

const SECTIONS: Record<ActiveSection, ComponentType> = {
  feed:          FeedSection,
  discover:      DiscoverSection,
  notifications: NotificationsSection,
  messages:      MessagesSection,
  profile:       ProfileSection,
  userProfile:   UserProfileSection,
};

/**
 * Client-side SPA dashboard — swaps sections without any route changes.
 * URL stays at "/" forever. Section is driven by Zustand activeSection state.
 */
export default function Dashboard() {
  const activeSection = useUIStore((s) => s.activeSection);
  const Section = SECTIONS[activeSection] ?? FeedSection;

  // Messages section needs full-height layout — no scroll padding wrappers
  if (activeSection === 'messages') {
    return (
      <div
        className="flex flex-col overflow-hidden"
        style={{ height: 'calc(100dvh - var(--top-bar-height) - var(--bottom-nav-height))' }}
      >
        <MessagesSection />
      </div>
    );
  }

  return (
    <div className="pt-bar pb-nav">
      {/* 12 px breathing room so content never sits flush against the mobile TopBar */}
      <div className="py-3">
        <Section />
      </div>
    </div>
  );
}
