import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PostCard from '@/components/post/PostCard';
import { PostVisibility, PostType, UserLevel, SubscriptionTier, ReactionType } from '@/types/enums';
import type { Post } from '@/types/models';

// ── API mocks ──────────────────────────────────────────────────────────────
jest.mock('@/lib/api/posts', () => ({
  reactToPost:    jest.fn().mockResolvedValue(undefined),
  removeReaction: jest.fn().mockResolvedValue(undefined),
  sharePost:      jest.fn().mockResolvedValue({ id: 'post-1', sharesCount: 1 }),
  bookmarkPost:   jest.fn().mockResolvedValue(undefined),
  unbookmarkPost: jest.fn().mockResolvedValue(undefined),
  deletePost:     jest.fn().mockResolvedValue(undefined),
  reportPost:     jest.fn().mockResolvedValue(undefined),
  getComments:    jest.fn().mockResolvedValue({ items: [], nextCursor: null, hasMore: false }),
  addComment:     jest.fn().mockResolvedValue({}),
  getPost:        jest.fn().mockResolvedValue(null),
  normalizePost:  (p: unknown) => p,
}));

import { reactToPost, removeReaction, bookmarkPost } from '@/lib/api/posts';

const author = {
  id: 'user-2',
  stateCode: 'AB/23B/0001',
  firstName: 'Ngozi', lastName: 'Eze',
  email: 'ngozi@test.com',
  servingState: 'Abia', batch: '2023B',
  level: UserLevel.CORPER,
  subscriptionTier: SubscriptionTier.FREE,
  isVerified: true, isOnboarded: true,
  isActive: true, corperTag: false,
  isFirstLogin: false, twoFactorEnabled: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 'post-1',
  authorId: 'user-2',
  author,
  content: 'Hello corpers!',
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

// Mock auth store so PostCard knows who the current user is
jest.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (s: { user: { id: string; firstName: string; lastName: string } | null }) => unknown) =>
    selector({ user: { id: 'user-1', firstName: 'Test', lastName: 'User' } }),
}));

// QueryClient created outside component so it is stable across re-renders
const testQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('React to post — integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    testQueryClient.clear();
  });

  it('calls reactToPost(LIKE) when like button is clicked on unreacted post', async () => {
    render(<PostCard post={makePost()} />, { wrapper });
    fireEvent.click(screen.getByLabelText('React to post'));
    await waitFor(() => {
      expect(reactToPost).toHaveBeenCalledWith('post-1', 'LIKE');
    });
  });

  it('optimistically increments reaction count before server responds', async () => {
    // Delay the mock so we can check the optimistic state
    (reactToPost as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 300))
    );
    render(<PostCard post={makePost({ reactionsCount: 3 })} />, { wrapper });
    fireEvent.click(screen.getByLabelText('React to post'));
    // Optimistic update shows 4 immediately
    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  it('removes reaction when clicking like on already-reacted post', async () => {
    render(
      <PostCard post={makePost({ myReaction: ReactionType.LIKE, reactionsCount: 5 })} />,
      { wrapper }
    );
    fireEvent.click(screen.getByLabelText('React to post'));
    await waitFor(() => {
      expect(removeReaction).toHaveBeenCalledWith('post-1');
    });
  });

  it('optimistically decrements count when removing reaction', async () => {
    (removeReaction as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 300))
    );
    render(
      <PostCard post={makePost({ myReaction: ReactionType.LIKE, reactionsCount: 5 })} />,
      { wrapper }
    );
    fireEvent.click(screen.getByLabelText('React to post'));
    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  it('calls bookmarkPost when bookmark button is clicked', async () => {
    render(<PostCard post={makePost()} />, { wrapper });
    fireEvent.click(screen.getByLabelText('Bookmark post'));
    await waitFor(() => {
      expect(bookmarkPost).toHaveBeenCalledWith('post-1');
    });
  });

  it('reaction rollback restores count on API error', async () => {
    (reactToPost as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    render(<PostCard post={makePost({ reactionsCount: 2 })} />, { wrapper });
    fireEvent.click(screen.getByLabelText('React to post'));
    await waitFor(() => {
      // After rollback, count should return to 2
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });
});
