import { create } from 'zustand';

interface MessagesState {
  /** The currently open conversation ID */
  activeConversationId: string | null;
  /** Users currently typing, keyed by conversationId */
  typingUsers: Record<string, string[]>;
  /** Set of online user IDs */
  onlineUsers: Set<string>;

  setActiveConversation: (id: string | null) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  resetMessages: () => void;
}

export const useMessagesStore = create<MessagesState>((set) => ({
  activeConversationId: null,
  typingUsers: {},
  onlineUsers: new Set<string>(),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const current = state.typingUsers[conversationId] ?? [];
      const updated = isTyping
        ? current.includes(userId) ? current : [...current, userId]
        : current.filter((u) => u !== userId);
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: updated,
        },
      };
    }),

  setUserOnline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.add(userId);
      return { onlineUsers: next };
    }),

  setUserOffline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    }),

  resetMessages: () =>
    set({ activeConversationId: null, typingUsers: {}, onlineUsers: new Set() }),
}));
