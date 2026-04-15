import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/constants';
import { setAccessToken } from '@/lib/api/client';
import { safeLocalStorage } from '@/lib/utils';
import type { User } from '@/types/models';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Actions
  setUser: (user: User) => void;
  setAuth: (user: User, accessToken: string) => void;
  updateUser: (updates: Partial<User>) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user }),

      setAuth: (user, accessToken) => {
        // Store access token in memory only — never in localStorage.
        // The refresh token lives in an httpOnly cookie set by the backend.
        // The cc_session flag cookie is also set server-side (immune to iOS ITP cap).
        setAccessToken(accessToken);
        set({ user, isAuthenticated: true, isLoading: false });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      clearAuth: () => {
        setAccessToken(null);
        // Clear ALL corpers-connect keys from localStorage
        if (typeof window !== 'undefined') {
          Object.values(STORAGE_KEYS).forEach((key) => {
            try { localStorage.removeItem(key); } catch {}
          });
          // Also clear any Zustand-persisted stores that use cc_ prefix
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('cc_')) {
              try { localStorage.removeItem(key); } catch {}
            }
          });
        }
        // Clear session cookie
        if (typeof document !== 'undefined') {
          document.cookie = `${STORAGE_KEYS.SESSION_FLAG}=; path=/; max-age=0`;
        }
        // Clear sessionStorage (splash shown flag etc.)
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: STORAGE_KEYS.USER,
      storage: createJSONStorage(() => {
        // Custom storage that only persists user data (not tokens)
        return {
          getItem: (name) => safeLocalStorage().get(name),
          setItem: (name, value) => safeLocalStorage().set(name, value),
          removeItem: (name) => safeLocalStorage().remove(name),
        };
      }),
      partialize: (state) => ({
        // Only persist user and isAuthenticated — never tokens
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Do NOT set isLoading=false here.  isLoading stays true (the initial
      // value) until AuthProvider.restoreSession() completes and calls setAuth
      // or setLoading(false).  This prevents the race condition where dashboard
      // queries fire with no Bearer token while AuthProvider is still running
      // the refresh call to restore the in-memory access token.
    }
  )
);
