'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUIStore } from '@/store/ui.store';
import { useMessagesStore } from '@/store/messages.store';
import { getConversation } from '@/lib/api/conversations';
import FeedSection from '@/components/sections/FeedSection';
import DiscoverSection from '@/components/sections/DiscoverSection';
import ReelsSection from '@/components/sections/ReelsSection';
import NotificationsSection from '@/components/sections/NotificationsSection';
import MessagesSection from '@/components/sections/MessagesSection';
import ProfileSection from '@/components/sections/ProfileSection';
import UserProfileSection from '@/components/sections/UserProfileSection';
import type { ActiveSection } from '@/store/ui.store';
import type { ComponentType } from 'react';

const SECTIONS: Record<ActiveSection, ComponentType> = {
  feed:          FeedSection,
  discover:      DiscoverSection,
  reels:         ReelsSection,
  notifications: NotificationsSection,
  messages:      MessagesSection,
  profile:       ProfileSection,
  userProfile:   UserProfileSection,
};

/**
 * Handles push-notification deep links via URL params on app open.
 * Must be wrapped in Suspense because it uses useSearchParams.
 *   ?conv=<conversationId>  → open that conversation in MessagesSection
 */
function DeepLinkHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setActiveSection = useUIStore((s) => s.setActiveSection);
  const setPendingConversation = useMessagesStore((s) => s.setPendingConversation);

  useEffect(() => {
    const conv = searchParams.get('conv');
    if (conv) {
      getConversation(conv)
        .then((conversation) => {
          setPendingConversation(conversation);
          setActiveSection('messages');
        })
        .catch(() => {/* conversation not found — ignore */})
        .finally(() => router.replace('/'));
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/**
 * Client-side SPA dashboard — swaps sections without any route changes.
 * URL stays at "/" forever. Section is driven by Zustand activeSection state.
 */
export default function Dashboard() {
  const activeSection = useUIStore((s) => s.activeSection);
  const Section = SECTIONS[activeSection] ?? FeedSection;

  // Messages and Reels need full-height layout — no scroll padding wrappers
  if (activeSection === 'messages' || activeSection === 'reels') {
    return (
      <>
        <Suspense><DeepLinkHandler /></Suspense>
        <div
          className="flex flex-col overflow-hidden"
          style={{
            height: 'calc(100dvh - var(--top-bar-height) - var(--bottom-nav-height))',
            marginTop: 'calc(var(--top-bar-height) + env(safe-area-inset-top, 0px))',
          }}
        >
          {activeSection === 'reels' ? <ReelsSection /> : <MessagesSection />}
        </div>
      </>
    );
  }

  return (
    <div className="pt-bar pb-nav">
      <Suspense><DeepLinkHandler /></Suspense>
      {/* 12 px breathing room so content never sits flush against the mobile TopBar */}
      <div className="py-3">
        <Section />
      </div>
    </div>
  );
}
