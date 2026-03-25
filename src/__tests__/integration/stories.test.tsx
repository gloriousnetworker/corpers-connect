import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Module mocks ────────────────────────────────────────────────────────────
jest.mock('@/lib/api/stories', () => ({
  getStories: jest.fn(),
  createStory: jest.fn(),
  viewStory: jest.fn(),
  deleteStory: jest.fn(),
}));

jest.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({
      user: {
        id: 'user-123',
        firstName: 'Tunde',
        lastName: 'Adeyemi',
        profilePicture: null,
        servingState: 'Lagos',
      },
    }),
}));

// ClientPortal renders children directly in tests
jest.mock('@/components/ui/ClientPortal', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// useBodyScrollLock is a no-op in tests
jest.mock('@/hooks/useBodyScrollLock', () => ({
  useBodyScrollLock: jest.fn(),
}));

import { getStories, createStory, viewStory, deleteStory } from '@/lib/api/stories';
import StoryTray from '@/components/stories/StoryTray';
import StoryRing from '@/components/stories/StoryRing';

const mockedGetStories = getStories as jest.Mock;
const mockedCreateStory = createStory as jest.Mock;
const mockedViewStory = viewStory as jest.Mock;
const mockedDeleteStory = deleteStory as jest.Mock;

const mockAuthor = {
  id: 'user-456',
  firstName: 'Ada',
  lastName: 'Okafor',
  profilePicture: null as string | null,
};

const mockStory = {
  id: 'story-1',
  authorId: 'user-456',
  author: mockAuthor,
  mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  mediaType: 'image',
  caption: 'Lagos vibes!',
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  createdAt: new Date().toISOString(),
  isViewed: false,
  viewCount: 0,
};

const mockStoryGroup = {
  author: mockAuthor,
  stories: [mockStory],
  hasUnviewed: true,
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

// ── StoryTray ────────────────────────────────────────────────────────────────
describe('StoryTray — integration', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders "Add story" ring when no stories exist', async () => {
    mockedGetStories.mockResolvedValue([]);
    render(<StoryTray />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Add story')).toBeInTheDocument();
    });
  });

  it('renders other users\' story rings when stories are loaded', async () => {
    mockedGetStories.mockResolvedValue([mockStoryGroup]);
    render(<StoryTray />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Ada')).toBeInTheDocument();
    });
  });

  it('shows skeleton placeholders while loading', () => {
    mockedGetStories.mockReturnValue(new Promise(() => {}));
    const { container } = render(<StoryTray />, { wrapper });
    const skeletons = container.querySelectorAll('.animate-pulse');
    // Add Story ring is rendered immediately (not a skeleton) + 3 skeleton rings
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it('opens StoryCreator when "Add story" is clicked', async () => {
    mockedGetStories.mockResolvedValue([]);
    render(<StoryTray />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Add story')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /add story/i }));
    // StoryCreator dialog should appear
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /create story/i })).toBeInTheDocument();
    });
  });

  it('opens StoryViewer when a story ring is clicked', async () => {
    mockedGetStories.mockResolvedValue([mockStoryGroup]);
    mockedViewStory.mockResolvedValue(undefined);
    render(<StoryTray />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Ada')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ada' }));
    await waitFor(() => {
      // StoryViewer aria-label is "{firstName}'s story"
      expect(screen.getByRole('dialog', { name: "Ada's story" })).toBeInTheDocument();
    });
  });
});

// ── StoryRing ────────────────────────────────────────────────────────────────
describe('StoryRing — unit', () => {
  it('shows initials when no profile picture', () => {
    render(<StoryRing author={{ firstName: 'Emeka', lastName: 'Obi', profilePicture: null }} label="Emeka" />);
    expect(screen.getByText('EO')).toBeInTheDocument();
  });

  it('uses correct aria-label', () => {
    render(<StoryRing author={{ firstName: 'Ngozi', lastName: 'Dike', profilePicture: null }} label="Ngozi" />);
    expect(screen.getByRole('button', { name: /ngozi/i })).toBeInTheDocument();
  });

  it('fires onClick when clicked', () => {
    const fn = jest.fn();
    render(<StoryRing author={{ firstName: 'A', lastName: 'B', profilePicture: null }} onClick={fn} />);
    fireEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ── createStory (API integration) ────────────────────────────────────────────
describe('createStory mutation', () => {
  afterEach(() => jest.clearAllMocks());

  it('calls createStory with file and caption', async () => {
    mockedGetStories.mockResolvedValue([]);
    mockedCreateStory.mockResolvedValue({ ...mockStory, id: 'story-new' });

    render(<StoryTray />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Add story')).toBeInTheDocument();
    });

    // Open creator
    fireEvent.click(screen.getByRole('button', { name: /add story/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /create story/i })).toBeInTheDocument();
    });

    // Try to post with no file — should not call createStory
    fireEvent.click(screen.getByRole('button', { name: /post story/i }));
    expect(mockedCreateStory).not.toHaveBeenCalled();
  });

  it('closes dialog on cancel', async () => {
    mockedGetStories.mockResolvedValue([]);
    render(<StoryTray />, { wrapper });
    await waitFor(() => screen.getByText('Add story'));

    fireEvent.click(screen.getByRole('button', { name: /add story/i }));
    await waitFor(() => screen.getByRole('dialog', { name: /create story/i }));

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /create story/i })).not.toBeInTheDocument();
    });
  });
});

// ── viewStory ────────────────────────────────────────────────────────────────
describe('viewStory', () => {
  afterEach(() => jest.clearAllMocks());

  it('calls viewStory API when a story is opened by a non-owner', async () => {
    // Return a promise so we can control when viewStory resolves
    mockedGetStories.mockResolvedValue([mockStoryGroup]);
    mockedViewStory.mockImplementation(() => Promise.resolve());

    render(<StoryTray />, { wrapper });
    await waitFor(() => screen.getByText('Ada'), { timeout: 5000 });

    fireEvent.click(screen.getByRole('button', { name: 'Ada' }));

    // The StoryViewer renders and its useEffect calls markViewed → viewMutation.mutate
    // Allow TanStack Query to execute the mutation
    await waitFor(
      () => {
        expect(mockedViewStory).toHaveBeenCalled();
      },
      { timeout: 5000, interval: 100 },
    );
    // TanStack Query v5 passes extra context as second arg — check first arg only
    expect(mockedViewStory.mock.calls[0][0]).toBe('story-1');
  });
});
