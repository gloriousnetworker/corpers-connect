import { create } from 'zustand';

// Registration state persisted between steps
export interface RegistrationState {
  stateCode: string;
  password: string;
  nyscData: {
    firstName: string;
    lastName: string;
    email: string;
    maskedEmail: string;
    servingState: string;
    batch: string;
    phone?: string;
  } | null;
  otpToken: string;
  maskedEmail: string;
}

// Password reset state persisted between steps
export interface PasswordResetState {
  email: string;
  otpToken: string;
  maskedEmail: string;
}

export type ActiveSection = 'feed' | 'discover' | 'reels' | 'notifications' | 'messages' | 'profile' | 'userProfile' | 'marketplace';

interface UIState {
  // Navigation — SPA section state (no route changes)
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;

  // Modals & sheets
  createPostOpen: boolean;
  setCreatePostOpen: (open: boolean) => void;

  // Registration flow state (in-memory, cleared on completion)
  registration: RegistrationState;
  setRegistration: (data: Partial<RegistrationState>) => void;
  clearRegistration: () => void;

  // Password reset flow state
  passwordReset: PasswordResetState;
  setPasswordReset: (data: Partial<PasswordResetState>) => void;
  clearPasswordReset: () => void;

  // 2FA challenge state
  twoFAChallenge: { challengeToken: string; userId: string } | null;
  setTwoFAChallenge: (data: { challengeToken: string; userId: string } | null) => void;

  // User profile navigation
  viewingUserId: string | null;
  previousSection: ActiveSection;
  setViewingUser: (id: string, from?: ActiveSection) => void;

  // Notifications badge
  unreadNotifications: number;
  setUnreadNotifications: (count: number) => void;
  incrementUnread: () => void;

  // Unread messages badge
  unreadMessages: number;
  setUnreadMessages: (count: number) => void;
  incrementUnreadMessages: () => void;
}

const defaultRegistration: RegistrationState = {
  stateCode: '',
  password: '',
  nyscData: null,
  otpToken: '',
  maskedEmail: '',
};

const defaultPasswordReset: PasswordResetState = {
  email: '',
  otpToken: '',
  maskedEmail: '',
};

export const useUIStore = create<UIState>((set) => ({
  activeSection: 'feed',
  setActiveSection: (section) => set({ activeSection: section }),

  viewingUserId: null,
  previousSection: 'feed',
  setViewingUser: (id, from) =>
    set((state) => ({
      viewingUserId: id,
      previousSection: from ?? state.activeSection as ActiveSection,
      activeSection: 'userProfile',
    })),

  createPostOpen: false,
  setCreatePostOpen: (open) => set({ createPostOpen: open }),

  registration: defaultRegistration,
  setRegistration: (data) =>
    set((state) => ({
      registration: { ...state.registration, ...data },
    })),
  clearRegistration: () => set({ registration: defaultRegistration }),

  passwordReset: defaultPasswordReset,
  setPasswordReset: (data) =>
    set((state) => ({
      passwordReset: { ...state.passwordReset, ...data },
    })),
  clearPasswordReset: () => set({ passwordReset: defaultPasswordReset }),

  twoFAChallenge: null,
  setTwoFAChallenge: (data) => set({ twoFAChallenge: data }),

  unreadNotifications: 0,
  setUnreadNotifications: (count) => {
    set({ unreadNotifications: count });
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      if (count > 0) {
        (navigator as Navigator & { setAppBadge: (n: number) => void }).setAppBadge(count);
      } else {
        (navigator as Navigator & { clearAppBadge: () => void }).clearAppBadge?.();
      }
    }
  },
  incrementUnread: () =>
    set((state) => {
      const next = state.unreadNotifications + 1;
      if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
        (navigator as Navigator & { setAppBadge: (n: number) => void }).setAppBadge(next);
      }
      return { unreadNotifications: next };
    }),

  unreadMessages: 0,
  setUnreadMessages: (count) => set({ unreadMessages: count }),
  incrementUnreadMessages: () =>
    set((state) => ({ unreadMessages: state.unreadMessages + 1 })),
}));
