'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { setAccessToken, getAccessToken } from '@/lib/api/client';
import { refreshTokens } from '@/lib/api/auth';
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
      const tokens = await refreshTokens();
      setAccessToken(tokens.accessToken);
    } catch {
      // Refresh token itself expired or revoked — log user out
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
  }, [clearAuth, stopRefreshTimer]);

  const startRefreshTimer = useCallback(() => {
    stopRefreshTimer();
    refreshTimerRef.current = setInterval(silentRefresh, REFRESH_INTERVAL_MS);
  }, [silentRefresh, stopRefreshTimer]);

  useEffect(() => {
    async function restoreSession() {
      try {
        // Cookie is sent automatically — no token to read from localStorage.
        const tokens = await refreshTokens();
        setAccessToken(tokens.accessToken);

        const user = await getMe();
        setAuth(user, tokens.accessToken);

        // Start proactive refresh timer now that we have a valid session
        startRefreshTimer();
      } catch {
        // Token invalid/expired — clear everything then redirect to login.
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
