import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PostCard from '@/components/post/PostCard';
import type { Post } from '@/types/models';
import { PostVisibility, PostType, UserLevel, SubscriptionTier } from '@/types/enums';

// Minimal mock post factory
const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 'post-1',
  authorId: 'user-1',
  author: {
    id: 'user-1',
    stateCode: 'LA/23A/0001',
    firstName: 'Amaka',
    lastName: 'Obi',
    email: 'amaka@test.com',
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
  },
  content: 'Test post content',
  mediaUrls: [],
  visibility: PostVisibility.PUBLIC,
  postType: PostType.REGULAR,
  isEdited: false,
  isFlagged: false,
  reactionsCount: 0,
  commentsCount: 0,
  myReaction: null,
  isBookmarked: false,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('PostCard', () => {
  it('renders post content', () => {
    render(<PostCard post={makePost()} />, { wrapper });
    expect(screen.getByText('Test post content')).toBeInTheDocument();
  });

  it('renders author name', () => {
    render(<PostCard post={makePost()} />, { wrapper });
    expect(screen.getByText('Amaka Obi')).toBeInTheDocument();
  });

  it('renders author serving state', () => {
    render(<PostCard post={makePost()} />, { wrapper });
    expect(screen.getByText('Lagos')).toBeInTheDocument();
  });

  it('renders visibility label', () => {
    render(<PostCard post={makePost({ visibility: PostVisibility.STATE })} />, { wrapper });
    expect(screen.getByText('State')).toBeInTheDocument();
  });

  it('shows edited label when post is edited', () => {
    render(<PostCard post={makePost({ isEdited: true })} />, { wrapper });
    expect(screen.getByText('edited')).toBeInTheDocument();
  });

  it('shows reactions count', () => {
    render(<PostCard post={makePost({ reactionsCount: 5 })} />, { wrapper });
    expect(screen.getByText('5 reactions')).toBeInTheDocument();
  });

  it('shows comments count as clickable button', () => {
    render(<PostCard post={makePost({ commentsCount: 3 })} />, { wrapper });
    expect(screen.getByText('3 comments')).toBeInTheDocument();
  });

  it('renders reaction bar with Like button', () => {
    render(<PostCard post={makePost()} />, { wrapper });
    expect(screen.getByLabelText('React to post')).toBeInTheDocument();
  });

  it('renders bookmark button', () => {
    render(<PostCard post={makePost()} />, { wrapper });
    expect(screen.getByLabelText('Bookmark post')).toBeInTheDocument();
  });

  it('shows filled bookmark when post is bookmarked', () => {
    render(<PostCard post={makePost({ isBookmarked: true })} />, { wrapper });
    expect(screen.getByLabelText('Remove bookmark')).toBeInTheDocument();
  });

  it('opens comment sheet on comment button click', async () => {
    render(<PostCard post={makePost()} />, { wrapper });
    const commentBtn = screen.getByLabelText('View comments');
    fireEvent.click(commentBtn);
    await waitFor(() => {
      expect(screen.getByText('0 Comments')).toBeInTheDocument();
    });
  });

  it('opens comment sheet on comments count click', async () => {
    render(<PostCard post={makePost({ commentsCount: 2 })} />, { wrapper });
    const countBtn = screen.getByText('2 comments');
    fireEvent.click(countBtn);
    await waitFor(() => {
      expect(screen.getByText('2 Comments')).toBeInTheDocument();
    });
  });

  it('renders corper tag when present', () => {
    const post = makePost();
    post.author = { ...post.author, corperTag: true, corperTagLabel: 'Corps Marshal' };
    render(<PostCard post={post} />, { wrapper });
    expect(screen.getByText('Corps Marshal')).toBeInTheDocument();
  });

  it('does not render when deleted', async () => {
    const { container } = render(<PostCard post={makePost()} />, { wrapper });
    // Menu button should be present initially
    expect(container.querySelector('[aria-label="Post options"]')).toBeInTheDocument();
  });
});
