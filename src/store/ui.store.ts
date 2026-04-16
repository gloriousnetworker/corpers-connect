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

export type ActiveSection = 'feed' | 'discover' | 'reels' | 'notifications' | 'messages' | 'profile' | 'userProfile' | 'marketplace' | 'opportunities' | 'subscriptions' | 'postDetail' | 'settings' | 'library';

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

  // Post detail navigation
  viewingPostId: string | null;
  setViewingPost: (id: string, from?: ActiveSection) => void;

  // Notifications badge
  unreadNotifications: number;
  setUnreadNotifications: (count: number) => void;
  incrementUnread: () => void;

  // Unread messages badge
  unreadMessages: number;
  setUnreadMessages: (count: number) => void;
  incrementUnreadMessages: () => void;

  // Hashtag deep-link: set to navigate Discover to a hashtag feed
  pendingHashtag: string | null;
  setHashtag: (tag: string | null) => void;
}

const REGISTRATION_KEY = 'cc_reg';

const defaultRegistration: RegistrationState = {
  stateCode: '',
  password: '',
  nyscData: null,
  otpToken: '',
  maskedEmail: '',
};

function loadRegistration(): RegistrationState {
  if (typeof window === 'undefined') return defaultRegistration;
  try {
    const raw = sessionStorage.getItem(REGISTRATION_KEY);
    return raw ? (JSON.parse(raw) as RegistrationState) : defaultRegistration;
  } catch {
    return defaultRegistration;
  }
}

function saveRegistration(state: RegistrationState) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(REGISTRATION_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function clearRegistrationStorage() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(REGISTRATION_KEY);
}

const defaultPasswordReset: PasswordResetState = {
  email: '',
  otpToken: '',
  maskedEmail: '',
};

// Push a browser history entry so the device back button navigates within
// the app rather than jumping straight to /login.
function pushAppHistory(state: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    window.history.pushState(state, '');
  }
}

export const useUIStore = create<UIState>((set) => ({
  activeSection: 'feed',
  setActiveSection: (section) => {
    pushAppHistory({ section });
    set({ activeSection: section });
  },

  viewingUserId: null,
  previousSection: 'feed',
  setViewingUser: (id, from) => {
    pushAppHistory({ section: 'userProfile', viewingUserId: id });
    set((state) => ({
      viewingUserId: id,
      previousSection: from ?? state.activeSection as ActiveSection,
      activeSection: 'userProfile',
    }));
  },

  viewingPostId: null,
  setViewingPost: (id, from) => {
    pushAppHistory({ section: 'postDetail', viewingPostId: id });
    set((state) => ({
      viewingPostId: id,
      previousSection: from ?? state.activeSection as ActiveSection,
      activeSection: 'postDetail',
    }));
  },

  createPostOpen: false,
  setCreatePostOpen: (open) => set({ createPostOpen: open }),

  registration: loadRegistration(),
  setRegistration: (data) =>
    set((state) => {
      const next = { ...state.registration, ...data };
      saveRegistration(next);
      return { registration: next };
    }),
  clearRegistration: () => {
    clearRegistrationStorage();
    set({ registration: defaultRegistration });
  },

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

  pendingHashtag: null,
  setHashtag: (tag) => set({ pendingHashtag: tag }),
}));
