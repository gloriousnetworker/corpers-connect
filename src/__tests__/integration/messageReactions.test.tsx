import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MessageBubble from '@/components/messages/MessageBubble';
import { MessageType } from '@/types/enums';
import type { Message } from '@/types/models';

// ── API mocks ─────────────────────────────────────────────────────────────────

jest.mock('@/lib/api/conversations', () => ({
  reactToMessage: jest.fn().mockResolvedValue({}),
  removeMessageReaction: jest.fn().mockResolvedValue({}),
  pinMessage: jest.fn().mockResolvedValue({}),
  normalizeMessage: (m: unknown) => m,
}));

jest.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (s: { user: { id: string; firstName: string; lastName: string } | null }) => unknown) =>
    selector({ user: { id: 'user-1', firstName: 'Test', lastName: 'User' } }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-2',
  sender: {
    id: 'user-2',
    firstName: 'Ngozi',
    lastName: 'Eze',
    stateCode: 'AB/23B/0001',
    email: 'ngozi@test.com',
    servingState: 'Abia',
    batch: '2023B',
    level: 'CORPER' as const,
    subscriptionTier: 'FREE' as const,
    isVerified: true,
    isOnboarded: true,
    isActive: true,
    corperTag: false,
    isFirstLogin: false,
    twoFactorEnabled: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  content: 'Hello!',
  type: MessageType.TEXT,
  isEdited: false,
  isDeleted: false,
  isPinned: false,
  reactions: [],
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

// ── Tests: reactions display ──────────────────────────────────────────────────

describe('MessageBubble — reactions display', () => {
  it('shows reaction emoji badge when reactions exist', () => {
    const msg = makeMessage({
      reactions: [
        { id: 'r1', messageId: 'msg-1', userId: 'user-1', user: {} as Message['sender'], emoji: '👍', createdAt: '2024-01-15T10:00:00Z' },
        { id: 'r2', messageId: 'msg-1', userId: 'user-2', user: {} as Message['sender'], emoji: '👍', createdAt: '2024-01-15T10:00:00Z' },
      ],
    });
    render(
      <MessageBubble message={msg} isOwn={false} showAvatar={true} isGroup={false} />,
      { wrapper }
    );
    expect(screen.getByLabelText(/2 👍 reaction/i)).toBeInTheDocument();
  });

  it('shows multiple distinct emoji badges', () => {
    const msg = makeMessage({
      reactions: [
        { id: 'r1', messageId: 'msg-1', userId: 'user-1', user: {} as Message['sender'], emoji: '👍', createdAt: '2024-01-15T10:00:00Z' },
        { id: 'r2', messageId: 'msg-1', userId: 'user-3', user: {} as Message['sender'], emoji: '❤️', createdAt: '2024-01-15T10:00:00Z' },
      ],
    });
    render(
      <MessageBubble message={msg} isOwn={false} showAvatar={true} isGroup={false} />,
      { wrapper }
    );
    expect(screen.getByLabelText(/👍/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/❤️/i)).toBeInTheDocument();
  });

  it('calls onReact when a reaction badge is clicked', () => {
    const onReact = jest.fn();
    const msg = makeMessage({
      reactions: [
        { id: 'r1', messageId: 'msg-1', userId: 'user-1', user: {} as Message['sender'], emoji: '😂', createdAt: '2024-01-15T10:00:00Z' },
      ],
    });
    render(
      <MessageBubble message={msg} isOwn={false} showAvatar={true} isGroup={false} onReact={onReact} />,
      { wrapper }
    );
    fireEvent.click(screen.getByLabelText(/😂/i));
    expect(onReact).toHaveBeenCalledWith(msg, '😂');
  });
});

// ── Tests: action sheet ───────────────────────────────────────────────────────

describe('MessageBubble — action sheet with reaction & pin', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows emoji quick-reaction row in action sheet when onReact is provided', async () => {
    const msg = makeMessage();
    render(
      <MessageBubble message={msg} isOwn={false} showAvatar={true} isGroup={false} onReact={jest.fn()} />,
      { wrapper }
    );
    fireEvent.contextMenu(screen.getByText('Hello!').parentElement!);
    await waitFor(() => {
      expect(screen.getByRole('menu', { name: 'Message actions' })).toBeInTheDocument();
    });
    expect(screen.getByLabelText('React with 👍')).toBeInTheDocument();
  });

  it('shows Pin action when onPin provided and message not pinned', async () => {
    const msg = makeMessage({ isPinned: false });
    render(
      <MessageBubble message={msg} isOwn={false} showAvatar={true} isGroup={false} onPin={jest.fn()} />,
      { wrapper }
    );
    fireEvent.contextMenu(screen.getByText('Hello!').parentElement!);
    await waitFor(() => {
      expect(screen.getByText('Pin message')).toBeInTheDocument();
    });
  });

  it('shows Unpin action when message is already pinned', async () => {
    const msg = makeMessage({ isPinned: true });
    render(
      <MessageBubble message={msg} isOwn={false} showAvatar={true} isGroup={false} onPin={jest.fn()} />,
      { wrapper }
    );
    fireEvent.contextMenu(screen.getByText('Hello!').parentElement!);
    await waitFor(() => {
      expect(screen.getByText('Unpin message')).toBeInTheDocument();
    });
  });

  it('calls onPin when Pin action is clicked', async () => {
    const onPin = jest.fn();
    const msg = makeMessage({ isPinned: false });
    render(
      <MessageBubble message={msg} isOwn={false} showAvatar={true} isGroup={false} onPin={onPin} />,
      { wrapper }
    );
    fireEvent.contextMenu(screen.getByText('Hello!').parentElement!);
    await waitFor(() => screen.getByText('Pin message'));
    fireEvent.click(screen.getByText('Pin message'));
    expect(onPin).toHaveBeenCalledWith(msg);
  });
});
