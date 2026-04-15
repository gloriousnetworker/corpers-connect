'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useMessagesStore } from '@/store/messages.store';
import { useMarketplaceStore } from '@/store/marketplace.store';
import { getConversation } from '@/lib/api/conversations';
import { useBackNavigation } from '@/hooks/useBackNavigation';
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
import PostDetailSection from '@/components/sections/PostDetailSection';
import SettingsSection from '@/components/sections/SettingsSection';
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
  postDetail:    PostDetailSection,
  settings:      SettingsSection,
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
  const pendingMktConvRef = useRef<string | null>(null);
  const sellerAppealRef = useRef<boolean>(false);
  useEffect(() => {
    pendingConvRef.current = searchParams.get('conv');
    pendingMktConvRef.current = searchParams.get('mkt-conv');
    sellerAppealRef.current = searchParams.get('seller-appeal') === '1';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once auth is ready, open the pending conversation
  useEffect(() => {
    if (!user) return;

    // Handle regular conversation deep link
    if (pendingConvRef.current) {
      const convId = pendingConvRef.current;
      pendingConvRef.current = null; // prevent double-trigger

      setActiveSection('messages');
      router.replace('/');
      getConversation(convId)
        .then((conversation) => setPendingConversation(conversation))
        .catch(() => {/* conversation not found */});
      return;
    }

    // Handle marketplace conversation deep link
    if (pendingMktConvRef.current) {
      const convId = pendingMktConvRef.current;
      pendingMktConvRef.current = null; // prevent double-trigger

      setActiveSection('marketplace');
      useMarketplaceStore.getState().openMarketplaceChat(convId);
      router.replace('/');
      return;
    }

    // Handle seller appeal deep link (from suspension email CTA)
    if (sellerAppealRef.current) {
      sellerAppealRef.current = false; // prevent double-trigger

      setActiveSection('marketplace');
      useMarketplaceStore.getState().setView('application-status');
      router.replace('/');
    }
  }, [user, router, setActiveSection, setPendingConversation]);

  return null;
}

/**
 * Client-side SPA dashboard — swaps sections without any route changes.
 * URL stays at "/" forever. Section is driven by Zustand activeSection state.
 */
export default function Dashboard() {
  // Intercept device back button — navigates through app sections instead of /login.
  useBackNavigation();

  const activeSection = useUIStore((s) => s.activeSection);
  const marketplaceView = useMarketplaceStore((s) => s.view);
  const Section = SECTIONS[activeSection] ?? FeedSection;

  // These views require a fixed-height full-screen layout so their internal
  // flex-col/h-full and overflow-y-auto structures work correctly.
  const needsFullHeight =
    activeSection === 'messages' ||
    activeSection === 'reels' ||
    (activeSection === 'marketplace' &&
      (marketplaceView === 'marketplace-chat' || marketplaceView === 'marketplace-conversations'));

  if (needsFullHeight) {
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
          <Section />
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
