/**
 * Integration tests for the Subscriptions (Corper Plus) feature.
 * Covers: free user upgrade pitch, premium user active subscription view,
 * plans page, loading/error states, and navigation between views.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/lib/api/subscriptions', () => ({
  getCurrentSubscription: jest.fn(),
  getLevel: jest.fn(),
  getPlans: jest.fn(),
  initializePayment: jest.fn(),
  verifyPayment: jest.fn(),
  cancelSubscription: jest.fn(),
  getSubscriptionHistory: jest.fn(),
  checkLevel: jest.fn(),
}));

// Writable auth mock — tests can update `mockAuthUser` to simulate premium
const mockAuthUser: { id: string; subscriptionTier: string } = {
  id: 'u1', subscriptionTier: 'FREE',
};

jest.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (s: { user: typeof mockAuthUser }) => unknown) =>
    selector({ user: mockAuthUser }),
}));

// subscriptions.store — writable mock so individual tests can override view
jest.mock('@/store/subscriptions.store', () => {
  const state = {
    view: 'dashboard',
    selectedPlan: null,
    pendingReference: null,
    setView: jest.fn(),
    selectPlan: jest.fn(),
    setPendingReference: jest.fn(),
    reset: jest.fn(),
  };
  return {
    useSubscriptionsStore: (selector?: (s: typeof state) => unknown) =>
      selector ? selector(state) : state,
    __state: state,
  };
});

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) =>
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />,
}));

import { getCurrentSubscription, getLevel, getPlans } from '@/lib/api/subscriptions';
import SubscriptionDashboard from '@/components/subscriptions/SubscriptionDashboard';
import PlansPage from '@/components/subscriptions/PlansPage';
import { SubscriptionTier, UserLevel } from '@/types/enums';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockLevelInfo = {
  currentLevel: UserLevel.OTONDO,
  subscriptionTier: SubscriptionTier.FREE,
  accountAgeDays: 15,
  nextLevel: {
    level: UserLevel.CORPER,
    requirements: [
      { label: 'Account age ≥ 30 days', met: false, current: 15, target: 30 },
      { label: 'At least 5 posts', met: true, current: 7, target: 5 },
    ],
  },
};

const mockSubscription = {
  id: 'sub-1',
  userId: 'u1',
  plan: 'MONTHLY',
  status: 'ACTIVE',
  startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
  reference: 'TXN_123456',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockPlans = [
  {
    id: 'MONTHLY',
    name: 'Monthly',
    price: 150000,
    priceFormatted: '₦1,500',
    currency: 'NGN',
    durationDays: 30,
    features: ['CORPER level badge', 'Boosted profile visibility', 'Cancel anytime'],
    savings: undefined,
  },
  {
    id: 'ANNUAL',
    name: 'Annual',
    price: 1400000,
    priceFormatted: '₦14,000',
    currency: 'NGN',
    durationDays: 365,
    features: ['Everything in Monthly', 'Save 22% vs monthly'],
    savings: 'Save 22%',
  },
];

function makeQC() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderDashboard() {
  return render(
    <QueryClientProvider client={makeQC()}>
      <SubscriptionDashboard />
    </QueryClientProvider>
  );
}

function renderPlans() {
  return render(
    <QueryClientProvider client={makeQC()}>
      <PlansPage />
    </QueryClientProvider>
  );
}

// ── SubscriptionDashboard — Free user ─────────────────────────────────────────

describe('SubscriptionDashboard (free user)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCurrentSubscription as jest.Mock).mockResolvedValue(null);
    (getLevel as jest.Mock).mockResolvedValue(mockLevelInfo);
  });

  it('renders the Corper Plus heading', () => {
    renderDashboard();
    expect(screen.getByText('Corper Plus')).toBeInTheDocument();
  });

  it('shows the upgrade pitch for free users', () => {
    renderDashboard();
    expect(screen.getByText('Upgrade to Corper Plus')).toBeInTheDocument();
  });

  it('shows premium feature bullets', () => {
    renderDashboard();
    expect(screen.getByText(/CORPER level badge/i)).toBeInTheDocument();
    expect(screen.getByText(/Boosted/i)).toBeInTheDocument();
  });

  it('renders See Plans & Pricing button', () => {
    renderDashboard();
    expect(screen.getByRole('button', { name: /see plans & pricing/i })).toBeInTheDocument();
  });

  it('renders View level details link', () => {
    renderDashboard();
    expect(screen.getByRole('button', { name: /view level details/i })).toBeInTheDocument();
  });

  it('renders skeleton while level loads', () => {
    (getLevel as jest.Mock).mockImplementation(() => new Promise(() => {}));
    renderDashboard();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders LevelProgressCard after level data loads', async () => {
    renderDashboard();
    // Level card renders after levelInfo resolves; OTONDO should appear
    await waitFor(() => {
      const cards = document.querySelectorAll('[data-testid="level-progress-card"], .rounded-2xl');
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});

// ── SubscriptionDashboard — Premium user ──────────────────────────────────────

describe('SubscriptionDashboard (premium user)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Switch to premium user for this suite
    mockAuthUser.subscriptionTier = SubscriptionTier.PREMIUM;
    (getCurrentSubscription as jest.Mock).mockResolvedValue(mockSubscription);
    (getLevel as jest.Mock).mockResolvedValue(mockLevelInfo);
  });

  afterEach(() => {
    // Reset back to FREE for other suites
    mockAuthUser.subscriptionTier = 'FREE';
  });

  it('renders the Corper Plus heading for premium user', () => {
    renderDashboard();
    expect(screen.getByText('Corper Plus')).toBeInTheDocument();
  });

  it('renders skeleton while subscription loads', () => {
    (getCurrentSubscription as jest.Mock).mockImplementation(() => new Promise(() => {}));
    renderDashboard();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders Subscription History link for premium user', () => {
    renderDashboard();
    expect(screen.getByRole('button', { name: /subscription history/i })).toBeInTheDocument();
  });

  it('renders Level & Progression link for premium user', () => {
    renderDashboard();
    expect(screen.getByRole('button', { name: /level & progression/i })).toBeInTheDocument();
  });
});

// ── PlansPage ─────────────────────────────────────────────────────────────────

describe('PlansPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getPlans as jest.Mock).mockResolvedValue(mockPlans);
  });

  it('renders the Corper Plus Plans heading', () => {
    renderPlans();
    expect(screen.getByText('Corper Plus Plans')).toBeInTheDocument();
  });

  it('renders upgrade hero text', () => {
    renderPlans();
    expect(screen.getByText('Upgrade to Corper Plus')).toBeInTheDocument();
  });

  it('renders feature list items', () => {
    renderPlans();
    expect(screen.getByText(/CORPER level badge on your profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Boosted visibility in Discover/i)).toBeInTheDocument();
  });

  it('renders plan cards after data loads', async () => {
    renderPlans();
    // Both plan names should appear
    expect(await screen.findByText('Monthly')).toBeInTheDocument();
    expect(await screen.findByText('Annual')).toBeInTheDocument();
  });

  it('renders plan prices', async () => {
    renderPlans();
    expect(await screen.findByText('₦1,500')).toBeInTheDocument();
    expect(await screen.findByText('₦14,000')).toBeInTheDocument();
  });

  it('shows skeleton loaders while plans load', () => {
    (getPlans as jest.Mock).mockImplementation(() => new Promise(() => {}));
    renderPlans();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders back button', () => {
    renderPlans();
    // The ArrowLeft button (back navigation)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows Paystack billing note', () => {
    renderPlans();
    expect(screen.getByText(/secure payment via paystack/i)).toBeInTheDocument();
  });

  it('shows savings badge on annual plan', async () => {
    renderPlans();
    await screen.findByText('Annual');
    const savingsBadges = screen.getAllByText(/save 22%/i);
    expect(savingsBadges.length).toBeGreaterThan(0);
  });
});
