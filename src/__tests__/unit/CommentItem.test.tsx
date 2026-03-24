import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CommentItem from '@/components/post/CommentItem';
import type { Comment } from '@/types/models';
import { UserLevel, SubscriptionTier } from '@/types/enums';

const mockAuthor = {
  id: 'user-2',
  stateCode: 'AB/23A/0002',
  firstName: 'Chidi',
  lastName: 'Nweze',
  email: 'chidi@test.com',
  servingState: 'Abia',
  batch: '2023A',
  level: UserLevel.KOPA,
  subscriptionTier: SubscriptionTier.FREE,
  isVerified: true,
  isOnboarded: true,
  isActive: true,
  corperTag: false,
  isFirstLogin: false,
  twoFactorEnabled: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const makeComment = (overrides: Partial<Comment> = {}): Comment => ({
  id: 'comment-1',
  postId: 'post-1',
  authorId: 'user-2',
  author: mockAuthor,
  content: 'Great post bro!',
  isEdited: false,
  replies: [],
  repliesCount: 0,
  createdAt: '2024-01-15T11:00:00Z',
  updatedAt: '2024-01-15T11:00:00Z',
  ...overrides,
});

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('CommentItem', () => {
  it('renders comment content', () => {
    render(<CommentItem postId="post-1" comment={makeComment()} />, { wrapper });
    expect(screen.getByText('Great post bro!')).toBeInTheDocument();
  });

  it('renders author name', () => {
    render(<CommentItem postId="post-1" comment={makeComment()} />, { wrapper });
    expect(screen.getByText('Chidi Nweze')).toBeInTheDocument();
  });

  it('shows edited label when comment is edited', () => {
    render(
      <CommentItem postId="post-1" comment={makeComment({ isEdited: true })} />,
      { wrapper }
    );
    expect(screen.getByText('edited')).toBeInTheDocument();
  });

  it('shows Reply button when onReply is provided', () => {
    const onReply = jest.fn();
    render(
      <CommentItem postId="post-1" comment={makeComment()} onReply={onReply} />,
      { wrapper }
    );
    expect(screen.getByText('Reply')).toBeInTheDocument();
  });

  it('calls onReply when Reply button clicked', () => {
    const onReply = jest.fn();
    const comment = makeComment();
    render(
      <CommentItem postId="post-1" comment={comment} onReply={onReply} />,
      { wrapper }
    );
    fireEvent.click(screen.getByText('Reply'));
    expect(onReply).toHaveBeenCalledWith(comment);
  });

  it('does not show Reply button when isReply=true', () => {
    const onReply = jest.fn();
    render(
      <CommentItem postId="post-1" comment={makeComment()} onReply={onReply} isReply />,
      { wrapper }
    );
    expect(screen.queryByText('Reply')).not.toBeInTheDocument();
  });

  it('shows load replies button when nested replies present', () => {
    const comment = makeComment({
      replies: [makeComment({ id: 'reply-1', content: 'Thanks!' })],
    });
    render(<CommentItem postId="post-1" comment={comment} />, { wrapper });
    expect(screen.getByText('View 1 reply')).toBeInTheDocument();
  });

  it('expands replies on click', () => {
    const comment = makeComment({
      replies: [makeComment({ id: 'reply-1', content: 'Thanks!' })],
    });
    render(<CommentItem postId="post-1" comment={comment} />, { wrapper });
    fireEvent.click(screen.getByText('View 1 reply'));
    expect(screen.getByText('Thanks!')).toBeInTheDocument();
  });
});
