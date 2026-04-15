'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { refreshSession, getAccessToken, ApiRequestError } from '@/lib/api/client';
import { getMe } from '@/lib/api/users';
import { ACCESS_TOKEN_EXPIRY_MINUTES } from '@/lib/constants';

// Refresh 2 minutes before the access token expires to avoid 401 gaps.
const REFRESH_INTERVAL_MS = (ACCESS_TOKEN_EXPIRY_MINUTES - 2) * 60 * 1000; // 13 min

/**
 * AuthProvider runs on app mount and restores the session by:
 * 1. Calling /auth/refresh (the httpOnly cc_refresh_token cookie is sent automatically)
 * 2. Calling /users/me to get current user data
 * 3. Populating the auth store
 *
 * It also starts a background timer that proactively refreshes the access token
 * before it expires, so users don't get unexpectedly logged out.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, setLoading, isAuthenticated } = useAuthStore();
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const silentRefresh = useCallback(async () => {
    try {
      await refreshSession();
    } catch (err) {
      // Only force-logout on explicit auth rejection (401/403 = token expired/revoked).
      // Network errors or server errors are transient — the 401 interceptor in client.ts
      // will handle expired access tokens when the next API call is made.
      const isAuthFailure =
        err instanceof ApiRequestError &&
        (err.statusCode === 401 || err.statusCode === 403);
      if (isAuthFailure) {
        stopRefreshTimer();
        clearAuth();
        if (typeof window !== 'undefined') {
          const { pathname } = window.location;
          const isAuthPage =
            pathname === '/login' ||
            pathname.startsWith('/register') ||
            pathname.startsWith('/forgot-password') ||
            pathname.startsWith('/reset-password');
          if (!isAuthPage) {
            window.location.replace('/login');
          }
        }
      }
      // else: transient failure — skip this cycle, try again next interval
    }
  }, [clearAuth, stopRefreshTimer]);

  const startRefreshTimer = useCallback(() => {
    stopRefreshTimer();
    refreshTimerRef.current = setInterval(silentRefresh, REFRESH_INTERVAL_MS);
  }, [silentRefresh, stopRefreshTimer]);

  useEffect(() => {
    async function restoreSession() {
      try {
        // Use the shared serialised refresh — guaranteed to not race with the
        // 401 interceptor even if API calls fire before this completes.
        const accessToken = await refreshSession();

        const user = await getMe();
        setAuth(user, accessToken);

        // Start proactive refresh timer now that we have a valid session
        startRefreshTimer();
      } catch (err) {
        // Only force-logout on explicit auth rejection (401/403).
        // Network errors or server 5xx are transient — don't log the user out.
        // Their refresh token cookie is likely still valid; they just had a bad request.
        const isAuthFailure =
          err instanceof ApiRequestError &&
          (err.statusCode === 401 || err.statusCode === 403);

        if (isAuthFailure) {
          clearAuth();
          if (typeof window !== 'undefined') {
            const { pathname } = window.location;
            const isAuthPage =
              pathname === '/login' ||
              pathname.startsWith('/register') ||
              pathname.startsWith('/forgot-password') ||
              pathname.startsWith('/reset-password');
            if (!isAuthPage) {
              window.location.replace('/login');
            }
          }
        } else {
          // Transient failure — keep any persisted auth state, just stop loading
          setLoading(false);
        }
      }
    }

    // Always restore if _accessToken is null (in-memory, reset on every cold start).
    // Zustand persist may rehydrate isAuthenticated=true, but _accessToken is still
    // null — so we must re-run the refresh flow regardless of persisted auth state.
    if (!isAuthenticated || !getAccessToken()) {
      restoreSession();
    } else {
      // Already authenticated — just start the refresh timer
      startRefreshTimer();
      setLoading(false);
    }

    return () => stopRefreshTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
