import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageBubble from '@/components/messages/MessageBubble';
import { MessageType } from '@/types/enums';
import type { Message } from '@/types/models';

const mockSender = {
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

const baseMessage: Message = {
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-1',
  sender: mockSender,
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

describe('MessageBubble', () => {
  it('renders text content', () => {
    render(
      <MessageBubble
        message={baseMessage}
        isOwn={true}
        showAvatar={false}
        isGroup={false}
      />
    );
    expect(screen.getByText('Hello world!')).toBeInTheDocument();
  });

  it('shows "This message was deleted" for deleted messages', () => {
    render(
      <MessageBubble
        message={{ ...baseMessage, isDeleted: true, content: null }}
        isOwn={false}
        showAvatar={true}
        isGroup={false}
      />
    );
    expect(screen.getByText('This message was deleted')).toBeInTheDocument();
  });

  it('shows "edited" badge for edited messages', () => {
    render(
      <MessageBubble
        message={{ ...baseMessage, isEdited: true }}
        isOwn={true}
        showAvatar={false}
        isGroup={false}
      />
    );
    expect(screen.getByText(/edited/i)).toBeInTheDocument();
  });

  it('shows sender initials avatar when showAvatar=true and no profilePicture', () => {
    render(
      <MessageBubble
        message={baseMessage}
        isOwn={false}
        showAvatar={true}
        isGroup={false}
      />
    );
    expect(screen.getByText('TA')).toBeInTheDocument();
  });

  it('shows sender name in group chat when showAvatar=true', () => {
    render(
      <MessageBubble
        message={baseMessage}
        isOwn={false}
        showAvatar={true}
        isGroup={true}
      />
    );
    expect(screen.getByText('Tunde')).toBeInTheDocument();
  });

  it('shows reply preview when replyTo is set', () => {
    const replyMsg: Message = {
      ...baseMessage,
      id: 'msg-0',
      content: 'Original message',
    };
    render(
      <MessageBubble
        message={{ ...baseMessage, replyTo: replyMsg, replyToId: 'msg-0' }}
        isOwn={false}
        showAvatar={false}
        isGroup={false}
      />
    );
    expect(screen.getByText('Original message')).toBeInTheDocument();
  });

  it('calls onReply when Reply is clicked in context menu', () => {
    const onReply = jest.fn();
    render(
      <MessageBubble
        message={baseMessage}
        isOwn={false}
        showAvatar={false}
        isGroup={false}
        onReply={onReply}
      />
    );
    // Right-click to open context menu
    fireEvent.contextMenu(screen.getByText('Hello world!').closest('div')!);
    fireEvent.click(screen.getByText('Reply'));
    expect(onReply).toHaveBeenCalledWith(baseMessage);
  });

  it('calls onEdit when Edit is clicked in context menu (own text message)', () => {
    const onEdit = jest.fn();
    render(
      <MessageBubble
        message={baseMessage}
        isOwn={true}
        showAvatar={false}
        isGroup={false}
        onEdit={onEdit}
      />
    );
    fireEvent.contextMenu(screen.getByText('Hello world!').closest('div')!);
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(baseMessage);
  });

  it('calls onDelete when Delete is clicked in context menu (own message)', () => {
    const onDelete = jest.fn();
    render(
      <MessageBubble
        message={baseMessage}
        isOwn={true}
        showAvatar={false}
        isGroup={false}
        onDelete={onDelete}
      />
    );
    fireEvent.contextMenu(screen.getByText('Hello world!').closest('div')!);
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith(baseMessage);
  });

  it('does not show Edit for non-own messages', () => {
    render(
      <MessageBubble
        message={baseMessage}
        isOwn={false}
        showAvatar={false}
        isGroup={false}
        onEdit={jest.fn()}
      />
    );
    fireEvent.contextMenu(screen.getByText('Hello world!').closest('div')!);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  // ── Blue tick (read receipt) tests ─────────────────────────────────────────

  it('shows single check (no blue ticks) when not read by anyone', () => {
    const { container } = render(
      <MessageBubble
        message={{ ...baseMessage, readBy: [] }}
        isOwn={true}
        showAvatar={false}
        isGroup={false}
        participantCount={2}
      />
    );
    // No sky-300 (blue) colour — single grey check
    expect(container.querySelector('svg.text-sky-300')).toBeNull();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows grey double check when delivered but not all participants have read', () => {
    const { container } = render(
      <MessageBubble
        message={{ ...baseMessage, readBy: ['other-user'] }}
        isOwn={true}
        showAvatar={false}
        isGroup={false}
        participantCount={3} // 3 participants — only 1 has read
      />
    );
    // Has a white/60 SVG but NOT sky-300
    expect(container.querySelector('svg.text-sky-300')).toBeNull();
    expect(container.querySelector('svg[class*="text-white"]')).toBeInTheDocument();
  });

  it('shows blue double check when all participants have read (DM)', () => {
    const { container } = render(
      <MessageBubble
        message={{ ...baseMessage, readBy: ['user-2'] }}
        isOwn={true}
        showAvatar={false}
        isGroup={false}
        participantCount={2} // 2 participants — 1 other read → allRead
      />
    );
    expect(container.querySelector('svg.text-sky-300')).toBeInTheDocument();
  });

  it('shows blue ticks for group when all other participants have read', () => {
    const { container } = render(
      <MessageBubble
        message={{ ...baseMessage, readBy: ['user-2', 'user-3'] }}
        isOwn={true}
        showAvatar={false}
        isGroup={true}
        participantCount={3} // 3 participants — 2 others read → allRead
      />
    );
    expect(container.querySelector('svg.text-sky-300')).toBeInTheDocument();
  });

  // ── Retry button tests ─────────────────────────────────────────────────────

  it('shows retry button when message has _failed=true', () => {
    const failedMessage = { ...baseMessage, _failed: true };
    render(
      <MessageBubble
        message={failedMessage}
        isOwn={true}
        showAvatar={false}
        isGroup={false}
        onRetry={jest.fn()}
      />
    );
    expect(screen.getByLabelText('Retry sending')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = jest.fn();
    const failedMessage = { ...baseMessage, _failed: true };
    render(
      <MessageBubble
        message={failedMessage}
        isOwn={true}
        showAvatar={false}
        isGroup={false}
        onRetry={onRetry}
      />
    );
    fireEvent.click(screen.getByLabelText('Retry sending'));
    expect(onRetry).toHaveBeenCalledWith(failedMessage);
  });

  it('shows a pending indicator when _pending=true (no blue/double check)', () => {
    const { container } = render(
      <MessageBubble
        message={{ ...baseMessage, _pending: true }}
        isOwn={true}
        showAvatar={false}
        isGroup={false}
      />
    );
    // Pending shows a clock icon — no blue ticks
    expect(container.querySelector('svg.text-sky-300')).toBeNull();
    // Some SVG status icon is rendered
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
