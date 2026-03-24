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
  feed:          FeedSection,
  discover:      DiscoverSection,
  notifications: NotificationsSection,
  messages:      MessagesSection,
  profile:       ProfileSection,
};

/**
 * Client-side SPA dashboard — swaps sections without any route changes.
 * URL stays at "/" forever. Section is driven by Zustand activeSection state.
 */
export default function Dashboard() {
  const activeSection = useUIStore((s) => s.activeSection);
  const Section = SECTIONS[activeSection] ?? FeedSection;

  return (
    <div className="pt-bar pb-nav">
      <Section />
    </div>
  );
}
