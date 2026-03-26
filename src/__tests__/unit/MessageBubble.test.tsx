import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

  it('calls onReply when Reply is clicked in action sheet', () => {
    jest.useFakeTimers();
    const onReply = jest.fn();
    const { container } = render(
      <MessageBubble
        message={baseMessage}
        isOwn={false}
        showAvatar={false}
        isGroup={false}
        onReply={onReply}
      />
    );
    const row = container.querySelector('.group')!;
    fireEvent.pointerDown(row, { clientX: 100, clientY: 100 });
    act(() => { jest.advanceTimersByTime(500); });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Reply' }));
    expect(onReply).toHaveBeenCalledWith(baseMessage);
    jest.useRealTimers();
  });

  it('calls onEdit when Edit is clicked in action sheet (own text message)', () => {
    jest.useFakeTimers();
    const onEdit = jest.fn();
    const { container } = render(
      <MessageBubble
        message={baseMessage}
        isOwn={true}
        showAvatar={false}
        isGroup={false}
        onEdit={onEdit}
      />
    );
    const row = container.querySelector('.group')!;
    fireEvent.pointerDown(row, { clientX: 100, clientY: 100 });
    act(() => { jest.advanceTimersByTime(500); });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith(baseMessage);
    jest.useRealTimers();
  });

  it('calls onDelete when Delete is clicked in action sheet (own message)', () => {
    jest.useFakeTimers();
    const onDelete = jest.fn();
    const { container } = render(
      <MessageBubble
        message={baseMessage}
        isOwn={true}
        showAvatar={false}
        isGroup={false}
        onDelete={onDelete}
      />
    );
    const row = container.querySelector('.group')!;
    fireEvent.pointerDown(row, { clientX: 100, clientY: 100 });
    act(() => { jest.advanceTimersByTime(500); });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith(baseMessage);
    jest.useRealTimers();
  });

  it('does not show Edit for non-own messages', () => {
    jest.useFakeTimers();
    const { container } = render(
      <MessageBubble
        message={baseMessage}
        isOwn={false}
        showAvatar={false}
        isGroup={false}
        onEdit={jest.fn()}
      />
    );
    const row = container.querySelector('.group')!;
    fireEvent.pointerDown(row, { clientX: 100, clientY: 100 });
    act(() => { jest.advanceTimersByTime(500); });
    expect(screen.queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
    jest.useRealTimers();
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

  it('copies text to clipboard when Copy is clicked in action sheet', () => {
    jest.useFakeTimers();
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
    const { container } = render(
      <MessageBubble
        message={baseMessage}
        isOwn={false}
        showAvatar={false}
        isGroup={false}
      />
    );
    const row = container.querySelector('.group')!;
    fireEvent.pointerDown(row, { clientX: 100, clientY: 100 });
    act(() => { jest.advanceTimersByTime(500); });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello world!');
    jest.useRealTimers();
  });

  it('triggers onReply when swiped right >= 60px', () => {
    const onReply = jest.fn();
    const { container } = render(
      <MessageBubble
        message={baseMessage}
        isOwn={false}
        showAvatar={false}
        isGroup={false}
        onReply={onReply}
      />
    );
    const row = container.querySelector('.group')!;
    fireEvent.touchStart(row, { touches: [{ clientX: 0, clientY: 0 }] });
    fireEvent.touchMove(row, { touches: [{ clientX: 70, clientY: 0 }] });
    fireEvent.touchEnd(row);
    expect(onReply).toHaveBeenCalledWith(baseMessage);
  });

  it('does not trigger onReply for vertical swipe', () => {
    const onReply = jest.fn();
    const { container } = render(
      <MessageBubble
        message={baseMessage}
        isOwn={false}
        showAvatar={false}
        isGroup={false}
        onReply={onReply}
      />
    );
    const row = container.querySelector('.group')!;
    fireEvent.touchStart(row, { touches: [{ clientX: 0, clientY: 0 }] });
    fireEvent.touchMove(row, { touches: [{ clientX: 10, clientY: 80 }] });
    fireEvent.touchEnd(row);
    expect(onReply).not.toHaveBeenCalled();
  });

  it('shows Forward option in action sheet when onForward is provided', () => {
    jest.useFakeTimers();
    const onForward = jest.fn();
    const { container } = render(
      <MessageBubble
        message={baseMessage}
        isOwn={false}
        showAvatar={false}
        isGroup={false}
        onForward={onForward}
      />
    );
    const row = container.querySelector('.group')!;
    fireEvent.pointerDown(row, { clientX: 100, clientY: 100 });
    act(() => { jest.advanceTimersByTime(500); });
    expect(screen.getByRole('menuitem', { name: 'Forward' })).toBeInTheDocument();
    jest.useRealTimers();
  });

  it('does not open action sheet on long press for deleted messages', () => {
    jest.useFakeTimers();
    const { container } = render(
      <MessageBubble
        message={{ ...baseMessage, isDeleted: true, content: null }}
        isOwn={false}
        showAvatar={false}
        isGroup={false}
      />
    );
    const row = container.querySelector('.group')!;
    fireEvent.pointerDown(row, { clientX: 100, clientY: 100 });
    act(() => { jest.advanceTimersByTime(500); });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    jest.useRealTimers();
  });
});
