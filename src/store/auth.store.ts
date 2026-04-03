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
        // The refresh token now lives in an httpOnly cookie set by the backend,
        // so there is nothing to persist on the client for token rotation.
        setAccessToken(accessToken);
        // Set session cookie for Next.js middleware route guard
        if (typeof document !== 'undefined') {
          document.cookie = `${STORAGE_KEYS.SESSION_FLAG}=1; path=/; max-age=2592000; SameSite=Lax`;
        }
        set({ user, isAuthenticated: true, isLoading: false });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      clearAuth: () => {
        setAccessToken(null);
        // Remove any legacy refresh token that may still be in localStorage
        // from before the httpOnly cookie migration.
        safeLocalStorage().remove(STORAGE_KEYS.REFRESH_TOKEN);
        safeLocalStorage().remove(STORAGE_KEYS.USER);
        // Clear session cookie
        if (typeof document !== 'undefined') {
          document.cookie = `${STORAGE_KEYS.SESSION_FLAG}=; path=/; max-age=0`;
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
      onRehydrateStorage: () => (state) => {
        // Mark loading as done after rehydration
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);
