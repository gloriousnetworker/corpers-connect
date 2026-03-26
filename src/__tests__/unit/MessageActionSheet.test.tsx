import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageActionSheet from '@/components/messages/MessageActionSheet';
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

describe('MessageActionSheet', () => {
  it('renders message preview for text message', () => {
    render(
      <MessageActionSheet
        message={baseMessage}
        isOwn={false}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText('Hello world!')).toBeInTheDocument();
  });

  it("renders '📷 Photo' preview for image message", () => {
    render(
      <MessageActionSheet
        message={{ ...baseMessage, type: MessageType.IMAGE, mediaUrl: 'https://example.com/img.jpg', content: null }}
        isOwn={false}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText('📷 Photo')).toBeInTheDocument();
  });

  it("renders '🎵 Voice note' preview for audio message", () => {
    render(
      <MessageActionSheet
        message={{ ...baseMessage, type: MessageType.AUDIO, mediaUrl: 'https://example.com/audio.mp3', content: null }}
        isOwn={false}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText('🎵 Voice note')).toBeInTheDocument();
  });

  it('renders Reply action when onReply is provided', () => {
    render(
      <MessageActionSheet
        message={baseMessage}
        isOwn={false}
        onClose={jest.fn()}
        onReply={jest.fn()}
      />
    );
    expect(screen.getByRole('menuitem', { name: 'Reply' })).toBeInTheDocument();
  });

  it('renders Copy action when onCopy is provided', () => {
    render(
      <MessageActionSheet
        message={baseMessage}
        isOwn={false}
        onClose={jest.fn()}
        onCopy={jest.fn()}
      />
    );
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toBeInTheDocument();
  });

  it('renders Forward action when onForward is provided', () => {
    render(
      <MessageActionSheet
        message={baseMessage}
        isOwn={false}
        onClose={jest.fn()}
        onForward={jest.fn()}
      />
    );
    expect(screen.getByRole('menuitem', { name: 'Forward' })).toBeInTheDocument();
  });

  it('renders Edit action for own text messages', () => {
    render(
      <MessageActionSheet
        message={baseMessage}
        isOwn={true}
        onClose={jest.fn()}
        onEdit={jest.fn()}
      />
    );
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
  });

  it('does not render Edit for non-own messages', () => {
    render(
      <MessageActionSheet
        message={baseMessage}
        isOwn={false}
        onClose={jest.fn()}
        onEdit={jest.fn()}
      />
    );
    expect(screen.queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('does not render Edit for image messages even if own', () => {
    render(
      <MessageActionSheet
        message={{ ...baseMessage, type: MessageType.IMAGE, mediaUrl: 'https://example.com/img.jpg' }}
        isOwn={true}
        onClose={jest.fn()}
        onEdit={jest.fn()}
      />
    );
    expect(screen.queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('renders Delete action for own messages', () => {
    render(
      <MessageActionSheet
        message={baseMessage}
        isOwn={true}
        onClose={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  });

  it('does not render Delete for non-own messages', () => {
    render(
      <MessageActionSheet
        message={baseMessage}
        isOwn={false}
        onClose={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('calls onReply and onClose when Reply is clicked', () => {
    const onReply = jest.fn();
    const onClose = jest.fn();
    render(
      <MessageActionSheet
        message={baseMessage}
        isOwn={false}
        onClose={onClose}
        onReply={onReply}
      />
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'Reply' }));
    expect(onReply).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = jest.fn();
    render(
      <MessageActionSheet
        message={baseMessage}
        isOwn={false}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = jest.fn();
    const { container } = render(
      <MessageActionSheet
        message={baseMessage}
        isOwn={false}
        onClose={onClose}
      />
    );
    // The backdrop is the first fixed div with aria-hidden
    const backdrop = container.querySelector('[aria-hidden="true"]')!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete and onClose when Delete is clicked', () => {
    const onDelete = jest.fn();
    const onClose = jest.fn();
    render(
      <MessageActionSheet
        message={baseMessage}
        isOwn={true}
        onClose={onClose}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
