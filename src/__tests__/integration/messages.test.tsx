import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ConversationList from '@/components/messages/ConversationList';
import ConversationItem from '@/components/messages/ConversationItem';
import { ConversationType, ParticipantRole, MessageType } from '@/types/enums';
import type { Conversation } from '@/types/models';

// Mock the API layer directly to avoid MSW complexity for unit-style tests
jest.mock('@/lib/api/conversations', () => ({
  getConversations: jest.fn(),
  normalizeMessage: jest.requireActual('@/lib/api/conversations').normalizeMessage,
}));

import { getConversations } from '@/lib/api/conversations';

const mockCurrentUser = {
  id: 'user-123',
  stateCode: 'LA/23A/1234',
  firstName: 'Tunde',
  lastName: 'Adeyemi',
  email: 'tunde@test.com',
  servingState: 'Lagos',
  batch: '2023A',
  level: 'CORPER' as const,
  subscriptionTier: 'FREE' as const,
  isVerified: true,
  isOnboarded: true,
  isActive: true,
  corperTag: false,
  isFirstLogin: false,
  twoFactorEnabled: false,
  profilePicture: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

jest.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (s: { user: typeof mockCurrentUser | null }) => unknown) =>
    selector({ user: mockCurrentUser }),
}));

jest.mock('@/store/messages.store', () => ({
  useMessagesStore: (selector: (s: {
    onlineUsers: Set<string>;
    activeConversationId: string | null;
  }) => unknown) =>
    selector({
      onlineUsers: new Set<string>(),
      activeConversationId: null,
    }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const mockOtherUser = {
  ...mockCurrentUser,
  id: 'user-456',
  firstName: 'Amaka',
  lastName: 'Obi',
  stateCode: 'AB/23A/0042',
  servingState: 'Abia',
};

const mockConv: Conversation = {
  id: 'conv-1',
  type: ConversationType.DM,
  name: null,
  picture: null,
  description: null,
  participants: [
    {
      conversationId: 'conv-1',
      userId: 'user-123',
      user: mockCurrentUser,
      role: ParticipantRole.MEMBER,
      joinedAt: '2024-01-15T10:00:00Z',
      isArchived: false,
      isPinned: false,
      isMuted: false,
      lastReadAt: null,
    },
    {
      conversationId: 'conv-1',
      userId: 'user-456',
      user: mockOtherUser,
      role: ParticipantRole.MEMBER,
      joinedAt: '2024-01-15T10:00:00Z',
      isArchived: false,
      isPinned: false,
      isMuted: false,
      lastReadAt: null,
    },
  ],
  lastMessage: null,
  unreadCount: 0,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

// ── ConversationList integration tests ──────────────────────────────────────

describe('ConversationList — integration', () => {
  beforeEach(() => {
    (getConversations as jest.Mock).mockResolvedValue([mockConv]);
  });

  it('shows loading skeleton initially', () => {
    // Slow the mock to capture loading state
    (getConversations as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([mockConv]), 500))
    );
    render(<ConversationList activeConversationId={null} onSelect={jest.fn()} />, { wrapper });
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders conversation after loading', async () => {
    render(<ConversationList activeConversationId={null} onSelect={jest.fn()} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Amaka Obi')).toBeInTheDocument();
    });
  });

  it('calls onSelect when a conversation item is clicked', async () => {
    const onSelect = jest.fn();
    render(<ConversationList activeConversationId={null} onSelect={onSelect} />, { wrapper });
    await waitFor(() => screen.getByText('Amaka Obi'));
    fireEvent.click(screen.getByText('Amaka Obi').closest('button')!);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(mockConv);
  });

  it('shows empty state when no conversations exist', async () => {
    (getConversations as jest.Mock).mockResolvedValue([]);
    render(<ConversationList activeConversationId={null} onSelect={jest.fn()} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/No conversations yet/i)).toBeInTheDocument();
    });
  });

  it('filters conversations by search query', async () => {
    const user = userEvent.setup();
    render(<ConversationList activeConversationId={null} onSelect={jest.fn()} />, { wrapper });
    await waitFor(() => screen.getByText('Amaka Obi'));

    const searchInput = screen.getByPlaceholderText(/Search conversations/i);
    await user.type(searchInput, 'xyz');
    expect(screen.queryByText('Amaka Obi')).not.toBeInTheDocument();
  });
});

// ── ConversationItem tests ───────────────────────────────────────────────────

describe('ConversationItem', () => {
  it('renders DM partner name', () => {
    render(
      <ConversationItem
        conversation={mockConv}
        currentUserId="user-123"
        onClick={jest.fn()}
      />
    );
    expect(screen.getByText('Amaka Obi')).toBeInTheDocument();
  });

  it('shows unread count badge', () => {
    render(
      <ConversationItem
        conversation={{ ...mockConv, unreadCount: 5 }}
        currentUserId="user-123"
        onClick={jest.fn()}
      />
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows photo icon for image last message', () => {
    render(
      <ConversationItem
        conversation={{
          ...mockConv,
          lastMessage: {
            id: 'msg-1',
            conversationId: 'conv-1',
            senderId: 'user-456',
            sender: mockOtherUser,
            content: null,
            type: MessageType.IMAGE,
            mediaUrl: 'https://example.com/photo.jpg',
            replyToId: null,
            replyTo: null,
            isEdited: false,
            isDeleted: false,
            deliveredAt: null,
            readBy: [],
            createdAt: '2024-01-15T10:01:00Z',
            updatedAt: '2024-01-15T10:01:00Z',
          },
        }}
        currentUserId="user-123"
        onClick={jest.fn()}
      />
    );
    expect(screen.getByText(/📷/)).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(
      <ConversationItem
        conversation={mockConv}
        currentUserId="user-123"
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows active styling when isActive=true', () => {
    const { container } = render(
      <ConversationItem
        conversation={mockConv}
        currentUserId="user-123"
        isActive={true}
        onClick={jest.fn()}
      />
    );
    expect(container.innerHTML).toContain('bg-primary/10');
  });

  it('shows group name for group conversations', () => {
    const groupConv: Conversation = {
      ...mockConv,
      id: 'conv-2',
      type: ConversationType.GROUP,
      name: 'NYSC Crew',
    };
    render(
      <ConversationItem
        conversation={groupConv}
        currentUserId="user-123"
        onClick={jest.fn()}
      />
    );
    expect(screen.getByText('NYSC Crew')).toBeInTheDocument();
  });

  it('shows deleted message preview', () => {
    const conv: Conversation = {
      ...mockConv,
      lastMessage: {
        id: 'msg-2',
        conversationId: 'conv-1',
        senderId: 'user-456',
        sender: mockOtherUser,
        content: null,
        type: MessageType.TEXT,
        mediaUrl: null,
        replyToId: null,
        replyTo: null,
        isEdited: false,
        isDeleted: true,
        deliveredAt: null,
        readBy: [],
        createdAt: '2024-01-15T10:02:00Z',
        updatedAt: '2024-01-15T10:02:00Z',
      },
    };
    render(
      <ConversationItem
        conversation={conv}
        currentUserId="user-123"
        onClick={jest.fn()}
      />
    );
    expect(screen.getByText('Message deleted')).toBeInTheDocument();
  });

  it('calls onLongPress after 500ms hold', () => {
    jest.useFakeTimers();
    const onLongPress = jest.fn();
    render(
      <ConversationItem
        conversation={mockConv}
        currentUserId="user-123"
        onClick={jest.fn()}
        onLongPress={onLongPress}
      />
    );
    fireEvent.pointerDown(screen.getByRole('button'), { clientX: 100, clientY: 100 });
    expect(onLongPress).not.toHaveBeenCalled();
    jest.advanceTimersByTime(500);
    expect(onLongPress).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(screen.getByRole('button'));
    jest.useRealTimers();
  });

  it('does not trigger onLongPress if press is cancelled (pointercancel)', () => {
    jest.useFakeTimers();
    const onLongPress = jest.fn();
    render(
      <ConversationItem
        conversation={mockConv}
        currentUserId="user-123"
        onClick={jest.fn()}
        onLongPress={onLongPress}
      />
    );
    const btn = screen.getByRole('button');
    fireEvent.pointerDown(btn, { clientX: 100, clientY: 100 });
    fireEvent.pointerCancel(btn); // e.g. scroll begins — cancels the press
    jest.advanceTimersByTime(600);
    expect(onLongPress).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('does not fire onClick after long-press', () => {
    jest.useFakeTimers();
    const onClick = jest.fn();
    const onLongPress = jest.fn();
    render(
      <ConversationItem
        conversation={mockConv}
        currentUserId="user-123"
        onClick={onClick}
        onLongPress={onLongPress}
      />
    );
    const btn = screen.getByRole('button');
    fireEvent.pointerDown(btn, { clientX: 100, clientY: 100 });
    jest.advanceTimersByTime(500);
    // Simulate click after long-press
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
