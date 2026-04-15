'use client';

import { useEffect } from 'react';
import { useUIStore, type ActiveSection } from '@/store/ui.store';

/**
 * Intercepts the device/browser back button inside the SPA.
 *
 * How it works:
 *  - On mount, replaceState stamps the current entry with { section: 'feed' }
 *    so there is always a labelled entry at the bottom of our history stack.
 *  - Every setActiveSection / setViewingUser / setViewingPost call already
 *    pushes a browser history entry (see ui.store.ts: pushAppHistory).
 *  - When the user presses back, popstate fires with the previous section
 *    state and we restore it directly — no URL change, no redirect to /login.
 *  - If the user has exhausted all app history entries the browser handles
 *    the back press normally (exits the PWA / goes to the OS app switcher).
 */
export function useBackNavigation() {
  useEffect(() => {
    // Label the entry the user landed on so we can restore it on popstate.
    if (!window.history.state?.section) {
      window.history.replaceState({ section: 'feed' }, '');
    }

    function handlePopState(event: PopStateEvent) {
      const state = event.state as {
        section: ActiveSection;
        viewingUserId?: string;
        viewingPostId?: string;
      } | null;

      // No app state in this entry — let the browser handle it.
      if (!state?.section) return;

      // Restore the Zustand state directly (no pushState — we're going back).
      useUIStore.setState({
        activeSection: state.section,
        ...(state.viewingUserId  !== undefined && { viewingUserId:  state.viewingUserId }),
        ...(state.viewingPostId !== undefined && { viewingPostId: state.viewingPostId }),
      });
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
}
