import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ForwardModal from '@/components/messages/ForwardModal';
import { ConversationType, MessageType, ParticipantRole } from '@/types/enums';
import type { Message, Conversation } from '@/types/models';

jest.mock('@/lib/api/conversations', () => ({
  getConversations: jest.fn(),
  sendMessage: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

import { getConversations, sendMessage } from '@/lib/api/conversations';
import { toast } from 'sonner';

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

const mockOtherUser = {
  ...mockCurrentUser,
  id: 'user-456',
  firstName: 'Amaka',
  lastName: 'Obi',
};

const mockMessage: Message = {
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-123',
  sender: mockCurrentUser,
  content: 'Hello world!',
  type: MessageType.TEXT,
  mediaUrl: null,
  replyToId: null,
  replyTo: null,
  isEdited: false,
  isDeleted: false,
  deliveredAt: null,
  readBy: [],
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const mockConv: Conversation = {
  id: 'conv-2',
  type: ConversationType.DM,
  name: null,
  picture: null,
  description: null,
  participants: [
    {
      conversationId: 'conv-2',
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
      conversationId: 'conv-2',
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

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('ForwardModal', () => {
  beforeEach(() => {
    (getConversations as jest.Mock).mockResolvedValue([mockConv]);
    (sendMessage as jest.Mock).mockResolvedValue({});
  });

  afterEach(() => jest.clearAllMocks());

  it("renders 'Forward to...' heading", () => {
    render(<ForwardModal message={mockMessage} currentUserId="user-123" onClose={jest.fn()} />, { wrapper });
    expect(screen.getByText('Forward to...')).toBeInTheDocument();
  });

  it('renders conversation list after loading', async () => {
    render(<ForwardModal message={mockMessage} currentUserId="user-123" onClose={jest.fn()} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Amaka Obi')).toBeInTheDocument();
    });
  });

  it('excludes the current conversation from the list', async () => {
    const sameConvMessage = { ...mockMessage, conversationId: 'conv-2' };
    render(<ForwardModal message={sameConvMessage} currentUserId="user-123" onClose={jest.fn()} />, { wrapper });
    await waitFor(() => {
      expect(screen.queryByText('Amaka Obi')).not.toBeInTheDocument();
    });
  });

  it('filters conversations by search query', async () => {
    const groupConv: Conversation = {
      ...mockConv,
      id: 'conv-3',
      type: ConversationType.GROUP,
      name: 'NYSC Crew',
    };
    (getConversations as jest.Mock).mockResolvedValue([mockConv, groupConv]);
    const user = userEvent.setup();
    render(<ForwardModal message={mockMessage} currentUserId="user-123" onClose={jest.fn()} />, { wrapper });
    await waitFor(() => screen.getByText('Amaka Obi'));
    const searchInput = screen.getByPlaceholderText('Search conversations...');
    await user.type(searchInput, 'NYSC');
    expect(screen.queryByText('Amaka Obi')).not.toBeInTheDocument();
    expect(screen.getByText('NYSC Crew')).toBeInTheDocument();
  });

  it('calls sendMessage and onClose when a conversation is selected', async () => {
    const onClose = jest.fn();
    render(<ForwardModal message={mockMessage} currentUserId="user-123" onClose={onClose} />, { wrapper });
    await waitFor(() => screen.getByText('Amaka Obi'));
    fireEvent.click(screen.getByText('Amaka Obi').closest('button')!);
    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith('conv-2', {
        content: 'Hello world!',
        type: MessageType.TEXT,
        mediaUrl: undefined,
      });
      expect(toast.success).toHaveBeenCalledWith('Message forwarded');
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('closes when backdrop is clicked', () => {
    const onClose = jest.fn();
    const { container } = render(
      <ForwardModal message={mockMessage} currentUserId="user-123" onClose={onClose} />,
      { wrapper }
    );
    const backdrop = container.querySelector('[aria-hidden="true"]')!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows error toast when sendMessage fails', async () => {
    (sendMessage as jest.Mock).mockRejectedValue(new Error('Network error'));
    render(<ForwardModal message={mockMessage} currentUserId="user-123" onClose={jest.fn()} />, { wrapper });
    await waitFor(() => screen.getByText('Amaka Obi'));
    fireEvent.click(screen.getByText('Amaka Obi').closest('button')!);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to forward message');
    });
  });
});
