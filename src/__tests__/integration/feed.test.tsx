import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the feed API directly for reliable test behavior
jest.mock('@/lib/api/feed', () => ({
  getFeed: jest.fn(),
}));
jest.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (s: { user: null }) => unknown) => selector({ user: null }),
}));
jest.mock('@/store/ui.store', () => ({
  useUIStore: (selector: (s: { createPostOpen: boolean; setCreatePostOpen: jest.Mock }) => unknown) =>
    selector({ createPostOpen: false, setCreatePostOpen: jest.fn() }),
}));

import { getFeed } from '@/lib/api/feed';
import InfiniteFeed from '@/components/feed/InfiniteFeed';
import { PostVisibility, PostType, UserLevel, SubscriptionTier } from '@/types/enums';

const mockedGetFeed = getFeed as jest.Mock;

const mockAuthor = {
  id: 'user-1',
  stateCode: 'LA/23A/0001',
  firstName: 'Tunde',
  lastName: 'Adeyemi',
  email: 'tunde@test.com',
  servingState: 'Lagos',
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

const mockPost = {
  id: 'post-1',
  authorId: 'user-1',
  author: mockAuthor,
  content: 'Hello from Lagos! First day at PPA.',
  mediaUrls: [],
  visibility: PostVisibility.PUBLIC,
  postType: PostType.REGULAR,
  isEdited: false,
  isFlagged: false,
  reactionsCount: 3,
  commentsCount: 1,
  myReaction: null,
  isBookmarked: false,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('InfiniteFeed — integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows skeleton loaders while loading', () => {
    // Mock a never-resolving promise to keep loading state
    mockedGetFeed.mockReturnValue(new Promise(() => {}));
    render(<InfiniteFeed />, { wrapper });
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders posts from the API', async () => {
    mockedGetFeed.mockResolvedValue({
      items: [mockPost],
      nextCursor: null,
      hasMore: false,
    });
    render(<InfiniteFeed />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Hello from Lagos! First day at PPA.')).toBeInTheDocument();
    });
  });

  it('renders the author name', async () => {
    mockedGetFeed.mockResolvedValue({
      items: [mockPost],
      nextCursor: null,
      hasMore: false,
    });
    render(<InfiniteFeed />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Tunde Adeyemi')).toBeInTheDocument();
    });
  });

  it('shows empty state when feed is empty', async () => {
    mockedGetFeed.mockResolvedValue({
      items: [],
      nextCursor: null,
      hasMore: false,
    });
    render(<InfiniteFeed />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Your feed is quiet')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    mockedGetFeed.mockRejectedValue(new Error('Network error'));
    render(<InfiniteFeed />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Failed to load feed')).toBeInTheDocument();
    });
  });

  it('renders retry button on error', async () => {
    mockedGetFeed.mockRejectedValue(new Error('Network error'));
    render(<InfiniteFeed />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('shows all caught up message at end of feed', async () => {
    mockedGetFeed.mockResolvedValue({
      items: [mockPost],
      nextCursor: null,
      hasMore: false,
    });
    render(<InfiniteFeed />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
    });
  });
});
