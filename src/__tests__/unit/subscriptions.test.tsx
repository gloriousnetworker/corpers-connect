/**
 * Unit tests for subscription components — PlanCard, PremiumGate, LevelProgressCard
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubscriptionPlan, UserLevel, SubscriptionTier } from '@/types/enums';
import type { SubscriptionPlanInfo } from '@/types/models';
import PlanCard from '@/components/subscriptions/PlanCard';
import PremiumGate from '@/components/subscriptions/PremiumGate';
import LevelProgressCard from '@/components/subscriptions/LevelProgressCard';
import type { LevelInfo } from '@/lib/api/subscriptions';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/store/ui.store', () => ({
  useUIStore: (selector: (s: { setActiveSection: jest.Mock }) => unknown) =>
    selector({ setActiveSection: jest.fn() }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const makePlan = (overrides: Partial<SubscriptionPlanInfo> = {}): SubscriptionPlanInfo => ({
  id: SubscriptionPlan.MONTHLY,
  name: 'Corper Plus Monthly',
  price: 150000,
  priceFormatted: '₦1,500',
  currency: 'NGN',
  durationDays: 30,
  features: ['CORPER level badge', 'Boosted visibility', 'Cancel anytime'],
  ...overrides,
});

const makeLevelInfo = (overrides: Partial<LevelInfo> = {}): LevelInfo => ({
  currentLevel: UserLevel.OTONDO,
  subscriptionTier: SubscriptionTier.FREE,
  accountAgeDays: 5,
  nextLevel: {
    level: UserLevel.KOPA,
    requirements: [
      { label: 'Account age 30+ days', met: false, current: 5, target: 30 },
      { label: 'Verified account', met: false },
    ],
  },
  ...overrides,
});

// ── PlanCard ──────────────────────────────────────────────────────────────────

describe('PlanCard', () => {
  it('renders with correct testid', () => {
    render(<PlanCard plan={makePlan()} onSelect={jest.fn()} />);
    expect(screen.getByTestId('plan-card')).toBeInTheDocument();
  });

  it('displays formatted price', () => {
    render(<PlanCard plan={makePlan({ priceFormatted: '₦1,500' })} onSelect={jest.fn()} />);
    expect(screen.getByText('₦1,500')).toBeInTheDocument();
  });

  it('renders all feature bullets', () => {
    render(<PlanCard plan={makePlan()} onSelect={jest.fn()} />);
    expect(screen.getByText('CORPER level badge')).toBeInTheDocument();
    expect(screen.getByText('Boosted visibility')).toBeInTheDocument();
    expect(screen.getByText('Cancel anytime')).toBeInTheDocument();
  });

  it('shows "Best Value" badge for ANNUAL plan', () => {
    render(<PlanCard plan={makePlan({ id: SubscriptionPlan.ANNUAL })} onSelect={jest.fn()} />);
    expect(screen.getByText('Best Value')).toBeInTheDocument();
  });

  it('does not show "Best Value" badge for MONTHLY plan', () => {
    render(<PlanCard plan={makePlan({ id: SubscriptionPlan.MONTHLY })} onSelect={jest.fn()} />);
    expect(screen.queryByText('Best Value')).not.toBeInTheDocument();
  });

  it('shows savings badge when provided', () => {
    render(<PlanCard plan={makePlan({ savings: 'Save 22%' })} onSelect={jest.fn()} />);
    expect(screen.getByText('Save 22%')).toBeInTheDocument();
  });

  it('shows "per year" label for ANNUAL plan', () => {
    render(<PlanCard plan={makePlan({ id: SubscriptionPlan.ANNUAL })} onSelect={jest.fn()} />);
    expect(screen.getByText('per year')).toBeInTheDocument();
  });

  it('shows "per month" label for MONTHLY plan', () => {
    render(<PlanCard plan={makePlan()} onSelect={jest.fn()} />);
    expect(screen.getByText('per month')).toBeInTheDocument();
  });

  it('calls onSelect when CTA button is clicked', () => {
    const onSelect = jest.fn();
    render(<PlanCard plan={makePlan()} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /Get Monthly Plan/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('disables button and shows spinner when loading', () => {
    render(<PlanCard plan={makePlan()} onSelect={jest.fn()} loading />);
    expect(screen.getByText('Processing…')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disables button when isSelected is true', () => {
    render(<PlanCard plan={makePlan()} onSelect={jest.fn()} isSelected />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

// ── PremiumGate ───────────────────────────────────────────────────────────────

describe('PremiumGate', () => {
  it('renders children directly when not locked', () => {
    render(
      <PremiumGate locked={false}>
        <p>Secret content</p>
      </PremiumGate>,
    );
    expect(screen.getByText('Secret content')).toBeInTheDocument();
    expect(screen.queryByTestId('premium-gate')).not.toBeInTheDocument();
  });

  it('renders the gate wrapper when locked', () => {
    render(
      <PremiumGate locked={true}>
        <p>Secret content</p>
      </PremiumGate>,
    );
    expect(screen.getByTestId('premium-gate')).toBeInTheDocument();
  });

  it('shows "Corper Plus Required" text when locked', () => {
    render(
      <PremiumGate locked={true}>
        <p>Hidden</p>
      </PremiumGate>,
    );
    expect(screen.getByText('Corper Plus Required')).toBeInTheDocument();
  });

  it('shows custom reason text when provided', () => {
    render(
      <PremiumGate locked={true} reason="Only for premium users">
        <p>Hidden</p>
      </PremiumGate>,
    );
    expect(screen.getByText('Only for premium users')).toBeInTheDocument();
  });

  it('renders upgrade button when locked', () => {
    render(
      <PremiumGate locked={true}>
        <p>Hidden</p>
      </PremiumGate>,
    );
    expect(screen.getByRole('button', { name: /Upgrade to Corper Plus/i })).toBeInTheDocument();
  });

  it('still renders children in the DOM (for blur effect) when locked', () => {
    render(
      <PremiumGate locked={true}>
        <p>Blurred text</p>
      </PremiumGate>,
    );
    expect(screen.getByText('Blurred text')).toBeInTheDocument();
  });

  it('renders nothing extra when locked is undefined (defaults to unlocked)', () => {
    render(
      <PremiumGate>
        <p>Open content</p>
      </PremiumGate>,
    );
    expect(screen.queryByTestId('premium-gate')).not.toBeInTheDocument();
    expect(screen.getByText('Open content')).toBeInTheDocument();
  });
});

// ── LevelProgressCard ─────────────────────────────────────────────────────────

describe('LevelProgressCard', () => {
  it('renders with correct testid', () => {
    render(<LevelProgressCard levelInfo={makeLevelInfo()} />);
    expect(screen.getByTestId('level-progress-card')).toBeInTheDocument();
  });

  it('shows current level label — Otondo', () => {
    render(<LevelProgressCard levelInfo={makeLevelInfo()} />);
    expect(screen.getByText('Otondo')).toBeInTheDocument();
  });

  it('shows current level label — Kopa', () => {
    render(<LevelProgressCard levelInfo={makeLevelInfo({ currentLevel: UserLevel.KOPA })} />);
    expect(screen.getByText('Kopa')).toBeInTheDocument();
  });

  it('shows current level label — Corper', () => {
    render(
      <LevelProgressCard
        levelInfo={makeLevelInfo({ currentLevel: UserLevel.CORPER, nextLevel: null })}
      />,
    );
    expect(screen.getByText('Corper')).toBeInTheDocument();
  });

  it('shows requirements for next level', () => {
    render(<LevelProgressCard levelInfo={makeLevelInfo()} />);
    expect(screen.getByText('Account age 30+ days')).toBeInTheDocument();
    expect(screen.getByText('Verified account')).toBeInTheDocument();
  });

  it('shows max level message when nextLevel is null', () => {
    render(
      <LevelProgressCard
        levelInfo={makeLevelInfo({ currentLevel: UserLevel.CORPER, nextLevel: null })}
      />,
    );
    expect(screen.getByText(/highest level/i)).toBeInTheDocument();
  });

  it('shows progress bar for numeric requirements in non-compact mode', () => {
    const { container } = render(
      <LevelProgressCard levelInfo={makeLevelInfo()} compact={false} />,
    );
    // The progress bar container div should be rendered
    expect(container.querySelector('.bg-primary.rounded-full')).toBeTruthy();
  });

  it('shows "To reach Kopa" section heading', () => {
    render(<LevelProgressCard levelInfo={makeLevelInfo()} />);
    expect(screen.getByText(/To reach Kopa/i)).toBeInTheDocument();
  });
});
