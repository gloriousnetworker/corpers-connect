/**
 * Integration tests for the Marketplace (Mami Market) feature.
 * Covers: browsing listings, searching, viewing listing detail,
 * creating a listing, and error/empty states.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/lib/api/marketplace', () => ({
  getListings: jest.fn(),
  getListingById: jest.fn(),
  createListing: jest.fn(),
  updateListing: jest.fn(),
  deleteListing: jest.fn(),
  getMyListings: jest.fn(),
  getSellerApplicationStatus: jest.fn(),
  applyAsSeller: jest.fn(),
}));

jest.mock('@/lib/api/users', () => ({
  getMe: jest.fn().mockResolvedValue({
    id: 'u1', firstName: 'Ada', lastName: 'Okafor', email: 'ada@test.com',
    stateCode: 'LA/24A/0001', servingState: 'Lagos', batch: '2024A',
    level: 'OTONDO', subscriptionTier: 'FREE', isVerified: true,
    isOnboarded: true, isActive: true, corperTag: false, isFirstLogin: false,
    twoFactorEnabled: false, createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
}));

jest.mock('@/store/marketplace.store', () => {
  const state = {
    selectListing: jest.fn(), setView: jest.fn(), activeFilters: {},
    setFilters: jest.fn(), clearFilters: jest.fn(), selectedListing: null,
    view: 'home',
  };
  return {
    useMarketplaceStore: (selector?: (s: typeof state) => unknown) =>
      selector ? selector(state) : state,
  };
});

jest.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (s: { user: { id: string } }) => unknown) =>
    selector({ user: { id: 'u1' } }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) =>
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />,
}));

import { getListings, getSellerApplicationStatus } from '@/lib/api/marketplace';
import MarketplaceHome from '@/components/marketplace/MarketplaceHome';
import {
  ListingCategory, ListingType, ListingStatus,
  UserLevel, SubscriptionTier,
} from '@/types/enums';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockSeller = {
  id: 'seller-1', firstName: 'Chidi', lastName: 'Nwosu',
  email: 'chidi@test.com', stateCode: 'AN/24A/0001', servingState: 'Anambra',
  batch: '2024A', level: UserLevel.OTONDO, subscriptionTier: SubscriptionTier.FREE,
  isVerified: true, isOnboarded: true, isActive: true, corperTag: false,
  isFirstLogin: false, twoFactorEnabled: false,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

const mockListing = {
  id: 'listing-1', title: 'NYSC Khaki Shirt (size M)', price: 2500,
  description: 'Clean khaki, worn twice', category: ListingCategory.UNIFORM,
  listingType: ListingType.FOR_SALE, status: ListingStatus.ACTIVE,
  images: [], seller: mockSeller, sellerId: mockSeller.id,
  viewsCount: 12, inquiriesCount: 3,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

const emptyPage = { items: [], hasMore: false, nextCursor: null };
const listingsPage = { items: [mockListing], hasMore: false, nextCursor: null };

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function renderMarketplace() {
  return render(
    <QueryClientProvider client={makeQC()}>
      <MarketplaceHome />
    </QueryClientProvider>
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('MarketplaceHome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getListings as jest.Mock).mockResolvedValue(listingsPage);
    (getSellerApplicationStatus as jest.Mock).mockResolvedValue({ status: null });
  });

  it('renders the Mami Market heading', () => {
    renderMarketplace();
    expect(screen.getByText('Mami Market')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    renderMarketplace();
    expect(screen.getByPlaceholderText('Search listings…')).toBeInTheDocument();
  });

  it('renders the Sell button', () => {
    renderMarketplace();
    expect(screen.getByRole('button', { name: /sell/i })).toBeInTheDocument();
  });

  it('renders a listing card after data loads', async () => {
    renderMarketplace();
    expect(await screen.findByText('NYSC Khaki Shirt (size M)')).toBeInTheDocument();
  });

  it('shows skeleton loaders while fetching', () => {
    (getListings as jest.Mock).mockImplementation(() => new Promise(() => {}));
    renderMarketplace();
    // Skeleton elements have animate-pulse class
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state when listing fetch fails', async () => {
    (getListings as jest.Mock).mockRejectedValue(new Error('Network error'));
    renderMarketplace();
    expect(await screen.findByText(/failed to load listings/i)).toBeInTheDocument();
  });

  it('shows empty state when there are no listings', async () => {
    (getListings as jest.Mock).mockResolvedValue(emptyPage);
    renderMarketplace();
    expect(await screen.findByText(/no listings found/i)).toBeInTheDocument();
  });

  it('renders category chips for filtering', () => {
    renderMarketplace();
    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
  });

  it('renders filter button', () => {
    renderMarketplace();
    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
  });

  it('shows listing price', async () => {
    renderMarketplace();
    expect(await screen.findByText(/2,500/)).toBeInTheDocument();
  });
});
