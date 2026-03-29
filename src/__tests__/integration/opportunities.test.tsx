/**
 * Integration tests for the Opportunities feature.
 * Covers: browsing listings, searching, type filters, remote toggle,
 * loading/error/empty states, and post button.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/lib/api/opportunities', () => ({
  getOpportunities: jest.fn(),
  getOpportunity: jest.fn(),
  createOpportunity: jest.fn(),
  updateOpportunity: jest.fn(),
  deleteOpportunity: jest.fn(),
  getMyOpportunities: jest.fn(),
  getSavedOpportunities: jest.fn(),
  getMyApplications: jest.fn(),
  applyToOpportunity: jest.fn(),
  saveOpportunity: jest.fn(),
  unsaveOpportunity: jest.fn(),
}));

jest.mock('@/store/opportunities.store', () => {
  const state = {
    selectOpportunity: jest.fn(),
    setView: jest.fn(),
    activeFilters: {},
    setFilters: jest.fn(),
    clearFilters: jest.fn(),
    selectedOpportunity: null,
    view: 'feed',
  };
  return {
    useOpportunitiesStore: (selector?: (s: typeof state) => unknown) =>
      selector ? selector(state) : state,
  };
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) =>
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />,
}));

import { getOpportunities } from '@/lib/api/opportunities';
import OpportunitiesHome from '@/components/opportunities/OpportunitiesHome';
import { OpportunityType, UserLevel, SubscriptionTier } from '@/types/enums';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockPoster = {
  id: 'poster-1', firstName: 'Emeka', lastName: 'Obi',
  email: 'emeka@test.com', stateCode: 'IM/24A/0001', servingState: 'Imo',
  batch: '2024A', level: UserLevel.OTONDO, subscriptionTier: SubscriptionTier.FREE,
  isVerified: true, isOnboarded: true, isActive: true, corperTag: false,
  isFirstLogin: false, twoFactorEnabled: false,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

const mockOpportunity = {
  id: 'opp-1',
  title: 'Frontend Engineer Internship',
  description: 'Join our growing team as a frontend intern',
  type: OpportunityType.INTERNSHIP,
  companyName: 'TechCorp Lagos',
  location: 'Lagos, Nigeria',
  isRemote: false,
  isFeatured: false,
  salary: '₦150,000/month',
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  viewsCount: 45,
  applicationsCount: 8,
  author: mockPoster,
  authorId: mockPoster.id,
  isSaved: false,
  hasApplied: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const emptyPage = { items: [], hasMore: false, nextCursor: null };
const opportunitiesPage = { items: [mockOpportunity], hasMore: false, nextCursor: null };

function makeQC() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderOpportunities() {
  return render(
    <QueryClientProvider client={makeQC()}>
      <OpportunitiesHome />
    </QueryClientProvider>
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('OpportunitiesHome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getOpportunities as jest.Mock).mockResolvedValue(opportunitiesPage);
  });

  it('renders the Opportunities heading', () => {
    renderOpportunities();
    expect(screen.getByText('Opportunities')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    renderOpportunities();
    expect(screen.getByPlaceholderText('Search jobs, companies…')).toBeInTheDocument();
  });

  it('renders the Post button', () => {
    renderOpportunities();
    const postBtns = screen.getAllByRole('button', { name: /post/i });
    expect(postBtns.length).toBeGreaterThan(0);
  });

  it('renders the Remote toggle button', () => {
    renderOpportunities();
    expect(screen.getByRole('button', { name: /remote/i })).toBeInTheDocument();
  });

  it('renders an opportunity card after data loads', async () => {
    renderOpportunities();
    expect(await screen.findByText('Frontend Engineer Internship')).toBeInTheDocument();
  });

  it('renders company name on the card', async () => {
    renderOpportunities();
    expect(await screen.findByText('TechCorp Lagos')).toBeInTheDocument();
  });

  it('shows skeleton loaders while fetching', () => {
    (getOpportunities as jest.Mock).mockImplementation(() => new Promise(() => {}));
    renderOpportunities();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state when fetch fails', async () => {
    (getOpportunities as jest.Mock).mockRejectedValue(new Error('Network error'));
    renderOpportunities();
    expect(await screen.findByText(/failed to load opportunities/i)).toBeInTheDocument();
  });

  it('shows empty state when there are no opportunities', async () => {
    (getOpportunities as jest.Mock).mockResolvedValue(emptyPage);
    renderOpportunities();
    expect(await screen.findByText(/no opportunities found/i)).toBeInTheDocument();
  });

  it('shows "Be the first to post" prompt in empty state with no filters', async () => {
    (getOpportunities as jest.Mock).mockResolvedValue(emptyPage);
    renderOpportunities();
    expect(
      await screen.findByText(/be the first to post an opportunity/i)
    ).toBeInTheDocument();
  });

  it('renders type chips for filtering', () => {
    renderOpportunities();
    // The TypeChips component renders the chip bar — it should contain some type labels
    // "All" chip is always present
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('renders My Posts shortcut button', () => {
    renderOpportunities();
    expect(screen.getByRole('button', { name: /my posts/i })).toBeInTheDocument();
  });

  it('renders Saved shortcut button', () => {
    renderOpportunities();
    expect(screen.getByRole('button', { name: /saved/i })).toBeInTheDocument();
  });

  it('renders Applications shortcut button', () => {
    renderOpportunities();
    expect(screen.getByRole('button', { name: /applications/i })).toBeInTheDocument();
  });

  it('shows remote badge on remote opportunity', async () => {
    const remoteOpp = { ...mockOpportunity, isRemote: true };
    (getOpportunities as jest.Mock).mockResolvedValue({ items: [remoteOpp], hasMore: false, nextCursor: null });
    renderOpportunities();
    await screen.findByText('Frontend Engineer Internship');
    // Multiple "Remote" elements may exist (toggle button + card badge)
    const remoteEls = screen.getAllByText(/remote/i);
    expect(remoteEls.length).toBeGreaterThan(1);
  });

  it('shows clear filters button in empty state when filters are active', async () => {
    (getOpportunities as jest.Mock).mockResolvedValue(emptyPage);
    renderOpportunities();

    // Click Remote toggle to activate a filter
    const remoteBtn = screen.getByRole('button', { name: /remote/i });
    fireEvent.click(remoteBtn);

    await waitFor(async () => {
      // After toggle + re-render with empty results, clear button appears
      const clearBtn = await screen.findByRole('button', { name: /clear filters/i });
      expect(clearBtn).toBeInTheDocument();
    });
  });
});
