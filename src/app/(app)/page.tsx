'use client';

import { useUIStore } from '@/store/ui.store';
import FeedSection from '@/components/sections/FeedSection';
import DiscoverSection from '@/components/sections/DiscoverSection';
import NotificationsSection from '@/components/sections/NotificationsSection';
import MessagesSection from '@/components/sections/MessagesSection';
import ProfileSection from '@/components/sections/ProfileSection';
import type { ActiveSection } from '@/store/ui.store';
import type { ComponentType } from 'react';

const SECTIONS: Record<ActiveSection, ComponentType> = {
  feed: FeedSection,
  discover: DiscoverSection,
  notifications: NotificationsSection,
  messages: MessagesSection,
  profile: ProfileSection,
};

/**
 * SPA Dashboard — the one and only page for authenticated users.
 * URL stays at "/" forever. Active section is driven by Zustand state.
 */
export default function DashboardPage() {
  const activeSection = useUIStore((s) => s.activeSection);
  const Section = SECTIONS[activeSection] ?? FeedSection;

  return (
    <div className="pt-bar pb-nav">
      <Section />
    </div>
  );
}
