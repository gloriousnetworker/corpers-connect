'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { setAccessToken, getAccessToken } from '@/lib/api/client';
import { STORAGE_KEYS } from '@/lib/constants';
import { safeLocalStorage } from '@/lib/utils';
import { refreshTokens } from '@/lib/api/auth';
import { getMe } from '@/lib/api/users';

/**
 * AuthProvider runs on app mount and restores the session by:
 * 1. Checking localStorage for a refresh token
 * 2. Calling /auth/refresh to get a fresh access token
 * 3. Calling /users/me to get current user data
 * 4. Populating the auth store
 *
 * This runs silently — no redirect happens here (middleware handles that).
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, setLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    async function restoreSession() {
      const storage = safeLocalStorage();
      const refreshToken = storage.get(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        setLoading(false);
        return;
      }

      try {
        // Get fresh tokens
        const tokens = await refreshTokens(refreshToken);
        setAccessToken(tokens.accessToken);
        storage.set(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);

        // Fetch user profile
        const user = await getMe();
        setAuth(user, tokens.accessToken, tokens.refreshToken);
      } catch {
        // Token invalid/expired — clear everything then redirect to login.
        // clearAuth() expires the session cookie; window.location forces a full
        // navigation so middleware re-evaluates and serves the login page cleanly
        // instead of the user seeing the dashboard with failed/empty queries.
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
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
