import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConversationItem from '@/components/messages/ConversationItem';
import { ConversationType, MessageType, ParticipantRole } from '@/types/enums';
import type { Conversation } from '@/types/models';

const mockUser1 = {
  id: 'user-1',
  firstName: 'Tunde',
  lastName: 'Adeyemi',
  stateCode: 'LA/23A/0001',
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

const mockUser2 = {
  ...mockUser1,
  id: 'user-2',
  firstName: 'Amaka',
  lastName: 'Obi',
  stateCode: 'AB/23A/0042',
  servingState: 'Abia',
};

const dmConversation: Conversation = {
  id: 'conv-1',
  type: ConversationType.DM,
  name: null,
  picture: null,
  description: null,
  participants: [
    {
      conversationId: 'conv-1',
      userId: 'user-1',
      user: mockUser1,
      role: ParticipantRole.MEMBER,
      joinedAt: '2024-01-15T10:00:00Z',
      isArchived: false,
      isPinned: false,
      isMuted: false,
      lastReadAt: null,
    },
    {
      conversationId: 'conv-1',
      userId: 'user-2',
      user: mockUser2,
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

describe('ConversationItem', () => {
  it('renders the DM partner name', () => {
    render(
      <ConversationItem
        conversation={dmConversation}
        currentUserId="user-1"
        onClick={jest.fn()}
      />
    );
    expect(screen.getByText('Amaka Obi')).toBeInTheDocument();
  });

  it('shows "No messages yet" when there is no last message', () => {
    render(
      <ConversationItem
        conversation={dmConversation}
        currentUserId="user-1"
        onClick={jest.fn()}
      />
    );
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });

  it('shows last message preview with "You:" prefix for own messages', () => {
    const conv: Conversation = {
      ...dmConversation,
      lastMessage: {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        sender: mockUser1,
        content: 'Hey there!',
        type: MessageType.TEXT,
        mediaUrl: null,
        replyToId: null,
        replyTo: null,
        isEdited: false,
        isDeleted: false,
        deliveredAt: null,
        readBy: [],
        createdAt: '2024-01-15T10:01:00Z',
        updatedAt: '2024-01-15T10:01:00Z',
      },
    };
    render(
      <ConversationItem
        conversation={conv}
        currentUserId="user-1"
        onClick={jest.fn()}
      />
    );
    expect(screen.getByText('You: Hey there!')).toBeInTheDocument();
  });

  it('shows unread badge when unreadCount > 0', () => {
    render(
      <ConversationItem
        conversation={{ ...dmConversation, unreadCount: 3 }}
        currentUserId="user-1"
        onClick={jest.fn()}
      />
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows "99+" for unread count > 99', () => {
    render(
      <ConversationItem
        conversation={{ ...dmConversation, unreadCount: 150 }}
        currentUserId="user-1"
        onClick={jest.fn()}
      />
    );
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(
      <ConversationItem
        conversation={dmConversation}
        currentUserId="user-1"
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies active styles when isActive=true', () => {
    const { container } = render(
      <ConversationItem
        conversation={dmConversation}
        currentUserId="user-1"
        isActive={true}
        onClick={jest.fn()}
      />
    );
    expect(container.innerHTML).toContain('bg-primary/10');
  });

  it('renders group conversation name', () => {
    const groupConv: Conversation = {
      ...dmConversation,
      id: 'conv-2',
      type: ConversationType.GROUP,
      name: 'NYSC Crew',
    };
    render(
      <ConversationItem
        conversation={groupConv}
        currentUserId="user-1"
        onClick={jest.fn()}
      />
    );
    expect(screen.getByText('NYSC Crew')).toBeInTheDocument();
  });

  it('shows deleted message text', () => {
    const conv: Conversation = {
      ...dmConversation,
      lastMessage: {
        id: 'msg-2',
        conversationId: 'conv-1',
        senderId: 'user-2',
        sender: mockUser2,
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
        currentUserId="user-1"
        onClick={jest.fn()}
      />
    );
    expect(screen.getByText('Message deleted')).toBeInTheDocument();
  });
});
