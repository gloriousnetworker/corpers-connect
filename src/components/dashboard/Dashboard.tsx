'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
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
import MarketplaceSection from '@/components/marketplace/MarketplaceSection';
import OpportunitiesSection from '@/components/opportunities/OpportunitiesSection';
import SubscriptionsSection from '@/components/subscriptions/SubscriptionsSection';
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
  marketplace:   MarketplaceSection,
  opportunities: OpportunitiesSection,
  subscriptions: SubscriptionsSection,
};

/**
 * Handles push-notification deep links via URL params on cold start.
 * Must be wrapped in Suspense because it uses useSearchParams.
 *
 *   ?conv=<conversationId>  → open that conversation in MessagesSection
 *
 * IMPORTANT: AuthProvider restores the session via two async network calls
 * (refreshTokens + getMe) before the access token exists. We must NOT call
 * getConversation() until user is non-null — otherwise the request fires
 * with no token, gets a 401, and the user lands on the home page.
 *
 * Strategy:
 *   1. On mount: read ?conv= and store it in a ref (URL still has the param).
 *   2. Watch user: once auth finishes and user is set, make the API call.
 */
function DeepLinkHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setActiveSection = useUIStore((s) => s.setActiveSection);
  const setPendingConversation = useMessagesStore((s) => s.setPendingConversation);

  // Capture the conv param once on mount before it's cleaned from the URL
  const pendingConvRef = useRef<string | null>(null);
  useEffect(() => {
    pendingConvRef.current = searchParams.get('conv');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once auth is ready, open the pending conversation
  useEffect(() => {
    if (!user || !pendingConvRef.current) return;
    const convId = pendingConvRef.current;
    pendingConvRef.current = null; // prevent double-trigger

    setActiveSection('messages');
    router.replace('/');
    getConversation(convId)
      .then((conversation) => setPendingConversation(conversation))
      .catch(() => {/* conversation not found */});
  }, [user, router, setActiveSection, setPendingConversation]);

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
