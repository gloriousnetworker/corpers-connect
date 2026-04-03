'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { setAccessToken, getAccessToken } from '@/lib/api/client';
import { refreshTokens } from '@/lib/api/auth';
import { getMe } from '@/lib/api/users';

/**
 * AuthProvider runs on app mount and restores the session by:
 * 1. Calling /auth/refresh (the httpOnly cc_refresh_token cookie is sent automatically)
 * 2. Calling /users/me to get current user data
 * 3. Populating the auth store
 *
 * No localStorage token reading needed — the refresh token is stored in an
 * httpOnly cookie by the backend and sent automatically on the /auth/refresh
 * request. This run silently; middleware handles redirects.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, setLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    async function restoreSession() {
      try {
        // Cookie is sent automatically — no token to read from localStorage.
        const tokens = await refreshTokens();
        setAccessToken(tokens.accessToken);

        const user = await getMe();
        setAuth(user, tokens.accessToken);
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
