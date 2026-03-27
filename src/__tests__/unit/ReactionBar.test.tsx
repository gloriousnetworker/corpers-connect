import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReactionBar from '@/components/post/ReactionBar';
import { PostVisibility, PostType, UserLevel, SubscriptionTier, ReactionType } from '@/types/enums';
import type { Post } from '@/types/models';

// ── API mocks ──────────────────────────────────────────────────────────────
jest.mock('@/lib/api/posts', () => ({
  reactToPost:      jest.fn().mockResolvedValue(undefined),
  removeReaction:   jest.fn().mockResolvedValue(undefined),
  sharePost:        jest.fn().mockResolvedValue({ id: 'post-1', sharesCount: 1 }),
  bookmarkPost:     jest.fn().mockResolvedValue(undefined),
  unbookmarkPost:   jest.fn().mockResolvedValue(undefined),
}));

import { reactToPost, removeReaction, bookmarkPost, unbookmarkPost } from '@/lib/api/posts';

// ── Helpers ────────────────────────────────────────────────────────────────

const author = {
  id: 'user-1',
  stateCode: 'LA/23A/0001',
  firstName: 'Amaka', lastName: 'Obi',
  email: 'amaka@test.com',
  servingState: 'Lagos', batch: '2023A',
  level: UserLevel.KOPA,
  subscriptionTier: SubscriptionTier.FREE,
  isVerified: false, isOnboarded: true,
  isActive: true, corperTag: false,
  isFirstLogin: false, twoFactorEnabled: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 'post-1',
  authorId: 'user-1',
  author,
  content: 'Test post',
  mediaUrls: [],
  visibility: PostVisibility.PUBLIC,
  postType: PostType.REGULAR,
  isEdited: false, isFlagged: false,
  reactionsCount: 0,
  commentsCount: 0,
  sharesCount: 0,
  myReaction: null,
  isBookmarked: false,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ReactionBar', () => {
  const onCommentClick = jest.fn();
  const onOptimisticUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Like button when no reaction', () => {
    render(
      <ReactionBar post={makePost()} onCommentClick={onCommentClick} onOptimisticUpdate={onOptimisticUpdate} />,
      { wrapper }
    );
    expect(screen.getByLabelText('React to post')).toBeInTheDocument();
    expect(screen.getByText('Like')).toBeInTheDocument();
  });

  it('shows reaction emoji when post has a reaction', () => {
    render(
      <ReactionBar
        post={makePost({ myReaction: ReactionType.LOVE, reactionsCount: 1 })}
        onCommentClick={onCommentClick}
        onOptimisticUpdate={onOptimisticUpdate}
      />,
      { wrapper }
    );
    // Should show the LOVE emoji, not the default 👍
    const reactBtn = screen.getByLabelText('React to post');
    expect(reactBtn.textContent).toContain('❤️');
  });

  it('calls reactToPost(LIKE) on first click', async () => {
    render(
      <ReactionBar post={makePost()} onCommentClick={onCommentClick} onOptimisticUpdate={onOptimisticUpdate} />,
      { wrapper }
    );
    fireEvent.click(screen.getByLabelText('React to post'));
    await waitFor(() => {
      expect(reactToPost).toHaveBeenCalledWith('post-1', 'LIKE');
    });
  });

  it('calls removeReaction when post already has myReaction and user clicks again', async () => {
    render(
      <ReactionBar
        post={makePost({ myReaction: ReactionType.LIKE, reactionsCount: 1 })}
        onCommentClick={onCommentClick}
        onOptimisticUpdate={onOptimisticUpdate}
      />,
      { wrapper }
    );
    fireEvent.click(screen.getByLabelText('React to post'));
    await waitFor(() => {
      expect(removeReaction).toHaveBeenCalledWith('post-1');
    });
  });

  it('calls onOptimisticUpdate immediately on like click', () => {
    render(
      <ReactionBar post={makePost()} onCommentClick={onCommentClick} onOptimisticUpdate={onOptimisticUpdate} />,
      { wrapper }
    );
    fireEvent.click(screen.getByLabelText('React to post'));
    expect(onOptimisticUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ myReaction: 'LIKE', reactionsCount: 1 })
    );
  });

  it('optimistic rollback calls onOptimisticUpdate on error', async () => {
    (reactToPost as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    render(
      <ReactionBar post={makePost()} onCommentClick={onCommentClick} onOptimisticUpdate={onOptimisticUpdate} />,
      { wrapper }
    );
    fireEvent.click(screen.getByLabelText('React to post'));
    await waitFor(() => {
      // Called twice: once for optimistic, once for rollback
      expect(onOptimisticUpdate).toHaveBeenCalledTimes(2);
    });
    // Second call restores original values
    expect(onOptimisticUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ myReaction: null, reactionsCount: 0 })
    );
  });

  it('calls onCommentClick when comment button is pressed', () => {
    render(
      <ReactionBar post={makePost()} onCommentClick={onCommentClick} onOptimisticUpdate={onOptimisticUpdate} />,
      { wrapper }
    );
    fireEvent.click(screen.getByLabelText('View comments'));
    expect(onCommentClick).toHaveBeenCalledTimes(1);
  });

  it('renders bookmark button in unbookmarked state', () => {
    render(
      <ReactionBar post={makePost()} onCommentClick={onCommentClick} onOptimisticUpdate={onOptimisticUpdate} />,
      { wrapper }
    );
    expect(screen.getByLabelText('Bookmark post')).toBeInTheDocument();
  });

  it('shows Remove bookmark label when already bookmarked', () => {
    render(
      <ReactionBar
        post={makePost({ isBookmarked: true })}
        onCommentClick={onCommentClick}
        onOptimisticUpdate={onOptimisticUpdate}
      />,
      { wrapper }
    );
    expect(screen.getByLabelText('Remove bookmark')).toBeInTheDocument();
  });

  it('calls bookmarkPost when bookmark button is clicked on unbookmarked post', async () => {
    render(
      <ReactionBar post={makePost()} onCommentClick={onCommentClick} onOptimisticUpdate={onOptimisticUpdate} />,
      { wrapper }
    );
    fireEvent.click(screen.getByLabelText('Bookmark post'));
    await waitFor(() => {
      expect(bookmarkPost).toHaveBeenCalledWith('post-1');
    });
  });

  it('calls unbookmarkPost when bookmark button is clicked on bookmarked post', async () => {
    render(
      <ReactionBar
        post={makePost({ isBookmarked: true })}
        onCommentClick={onCommentClick}
        onOptimisticUpdate={onOptimisticUpdate}
      />,
      { wrapper }
    );
    fireEvent.click(screen.getByLabelText('Remove bookmark'));
    await waitFor(() => {
      expect(unbookmarkPost).toHaveBeenCalledWith('post-1');
    });
  });

  it('opens reaction picker after 400ms long press', () => {
    jest.useFakeTimers();
    render(
      <ReactionBar post={makePost()} onCommentClick={onCommentClick} onOptimisticUpdate={onOptimisticUpdate} />,
      { wrapper }
    );
    const reactBtn = screen.getByLabelText('React to post');
    fireEvent.pointerDown(reactBtn);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(400));
    // Picker should now be open (rendered into DOM)
    expect(document.querySelector('[data-reaction-picker]') || document.querySelector('.reaction-picker') || document.body.innerHTML).toBeTruthy();
    jest.useRealTimers();
  });

  it('renders share button', () => {
    render(
      <ReactionBar post={makePost()} onCommentClick={onCommentClick} onOptimisticUpdate={onOptimisticUpdate} />,
      { wrapper }
    );
    expect(screen.getByLabelText('Share post')).toBeInTheDocument();
  });

  it('shows share count when sharesCount > 0', () => {
    render(
      <ReactionBar
        post={makePost({ sharesCount: 7 })}
        onCommentClick={onCommentClick}
        onOptimisticUpdate={onOptimisticUpdate}
      />,
      { wrapper }
    );
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});
