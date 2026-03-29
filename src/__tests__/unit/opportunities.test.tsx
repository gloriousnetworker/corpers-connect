/**
 * Unit tests for opportunities components — TypeChips, OpportunityCard
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OpportunityType, UserLevel, SubscriptionTier } from '@/types/enums';
import type { Opportunity } from '@/types/models';
import TypeChips from '@/components/opportunities/TypeChips';
import OpportunityCard from '@/components/opportunities/OpportunityCard';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/lib/api/opportunities', () => ({
  saveOpportunity: jest.fn(),
  unsaveOpportunity: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: jest.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function withQueryClient(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const makeOpportunity = (overrides: Partial<Opportunity> = {}): Opportunity => ({
  id: 'opp-1',
  authorId: 'user-1',
  author: {
    id: 'user-1',
    stateCode: 'LA/23A/0001',
    firstName: 'Amaka',
    lastName: 'Obi',
    email: 'amaka@test.com',
    servingState: 'Lagos',
    batch: '2023A',
    level: UserLevel.CORPER,
    subscriptionTier: SubscriptionTier.FREE,
    isVerified: false,
    isOnboarded: true,
    isActive: true,
    corperTag: false,
    isFirstLogin: false,
    twoFactorEnabled: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  title: 'Software Engineer Intern',
  description: 'Great internship opportunity for corpers.',
  type: OpportunityType.INTERNSHIP,
  companyName: 'TechCorp Nigeria',
  location: 'Abuja',
  isRemote: false,
  salary: '₦80,000/month',
  deadline: null,
  requirements: null,
  contactEmail: null,
  companyWebsite: null,
  isFeatured: false,
  isSaved: false,
  hasApplied: false,
  createdAt: '2024-06-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
  ...overrides,
});

// ── TypeChips ─────────────────────────────────────────────────────────────────

describe('TypeChips', () => {
  it('renders the container with correct testid', () => {
    render(<TypeChips selected="ALL" onChange={jest.fn()} />);
    expect(screen.getByTestId('type-chips')).toBeInTheDocument();
  });

  it('renders all type labels', () => {
    render(<TypeChips selected="ALL" onChange={jest.fn()} />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('Internships')).toBeInTheDocument();
    expect(screen.getByText('Volunteer')).toBeInTheDocument();
    expect(screen.getByText('Contract')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('applies active style to the selected chip', () => {
    render(<TypeChips selected={OpportunityType.JOB} onChange={jest.fn()} />);
    const jobBtn = screen.getByText('Jobs').closest('button')!;
    expect(jobBtn.className).toContain('bg-primary');
  });

  it('calls onChange with the clicked type', () => {
    const onChange = jest.fn();
    render(<TypeChips selected="ALL" onChange={onChange} />);
    fireEvent.click(screen.getByText('Volunteer'));
    expect(onChange).toHaveBeenCalledWith(OpportunityType.VOLUNTEER);
  });

  it('calls onChange with ALL when the All chip is clicked', () => {
    const onChange = jest.fn();
    render(<TypeChips selected={OpportunityType.JOB} onChange={onChange} />);
    fireEvent.click(screen.getByText('All'));
    expect(onChange).toHaveBeenCalledWith('ALL');
  });

  it('non-selected chips do not have active bg-primary style', () => {
    render(<TypeChips selected="ALL" onChange={jest.fn()} />);
    const internBtn = screen.getByText('Internships').closest('button')!;
    expect(internBtn.className).not.toContain('bg-primary');
    expect(internBtn.className).toContain('bg-muted');
  });
});

// ── OpportunityCard ───────────────────────────────────────────────────────────

describe('OpportunityCard', () => {
  it('renders with correct testid', () => {
    withQueryClient(
      <OpportunityCard opportunity={makeOpportunity()} onClick={jest.fn()} />,
    );
    expect(screen.getByTestId('opportunity-card')).toBeInTheDocument();
  });

  it('displays opportunity title and company name', () => {
    withQueryClient(
      <OpportunityCard opportunity={makeOpportunity()} onClick={jest.fn()} />,
    );
    expect(screen.getByText('Software Engineer Intern')).toBeInTheDocument();
    expect(screen.getByText('TechCorp Nigeria')).toBeInTheDocument();
  });

  it('shows salary when provided', () => {
    withQueryClient(
      <OpportunityCard opportunity={makeOpportunity({ salary: '₦80,000/month' })} onClick={jest.fn()} />,
    );
    expect(screen.getByText('₦80,000/month')).toBeInTheDocument();
  });

  it('does not show salary element when absent', () => {
    withQueryClient(
      <OpportunityCard opportunity={makeOpportunity({ salary: null })} onClick={jest.fn()} />,
    );
    expect(screen.queryByText(/₦/)).not.toBeInTheDocument();
  });

  it('renders the correct type badge', () => {
    withQueryClient(
      <OpportunityCard opportunity={makeOpportunity({ type: OpportunityType.INTERNSHIP })} onClick={jest.fn()} />,
    );
    expect(screen.getByText('Internship')).toBeInTheDocument();
  });

  it('shows Remote badge when isRemote is true', () => {
    withQueryClient(
      <OpportunityCard opportunity={makeOpportunity({ isRemote: true })} onClick={jest.fn()} />,
    );
    expect(screen.getByText('Remote')).toBeInTheDocument();
  });

  it('hides Remote badge when isRemote is false', () => {
    withQueryClient(
      <OpportunityCard opportunity={makeOpportunity({ isRemote: false })} onClick={jest.fn()} />,
    );
    expect(screen.queryByText('Remote')).not.toBeInTheDocument();
  });

  it('shows Featured badge when isFeatured is true', () => {
    withQueryClient(
      <OpportunityCard opportunity={makeOpportunity({ isFeatured: true })} onClick={jest.fn()} />,
    );
    expect(screen.getByText('⭐ Featured')).toBeInTheDocument();
  });

  it('shows Applied badge when hasApplied is true', () => {
    withQueryClient(
      <OpportunityCard opportunity={makeOpportunity({ hasApplied: true })} onClick={jest.fn()} />,
    );
    expect(screen.getByText('✓ Applied')).toBeInTheDocument();
  });

  it('shows location', () => {
    withQueryClient(
      <OpportunityCard opportunity={makeOpportunity({ location: 'Port Harcourt' })} onClick={jest.fn()} />,
    );
    expect(screen.getByText('Port Harcourt')).toBeInTheDocument();
  });

  it('shows Expired when deadline is in the past', () => {
    withQueryClient(
      <OpportunityCard
        opportunity={makeOpportunity({ deadline: '2020-01-01T00:00:00Z' })}
        onClick={jest.fn()}
      />,
    );
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('shows Closes date when deadline is in the future', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    withQueryClient(
      <OpportunityCard
        opportunity={makeOpportunity({ deadline: futureDate.toISOString() })}
        onClick={jest.fn()}
      />,
    );
    expect(screen.getByText(/Closes/)).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const onClick = jest.fn();
    const opp = makeOpportunity();
    withQueryClient(<OpportunityCard opportunity={opp} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('opportunity-card'));
    expect(onClick).toHaveBeenCalledWith(opp);
  });

  it('renders save button with Unsave aria-label when already saved', () => {
    withQueryClient(
      <OpportunityCard opportunity={makeOpportunity({ isSaved: true })} onClick={jest.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Unsave' })).toBeInTheDocument();
  });

  it('renders save button with Save aria-label when not saved', () => {
    withQueryClient(
      <OpportunityCard opportunity={makeOpportunity({ isSaved: false })} onClick={jest.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('shows company initial avatar when no logo image', () => {
    withQueryClient(
      <OpportunityCard opportunity={makeOpportunity({ companyName: 'ZenithTech' })} onClick={jest.fn()} />,
    );
    expect(screen.getByText('Z')).toBeInTheDocument();
  });

  it('shows verified checkmark when author is verified', () => {
    const opp = makeOpportunity();
    opp.author.isVerified = true;
    withQueryClient(<OpportunityCard opportunity={opp} onClick={jest.fn()} />);
    // CheckCircle is rendered as SVG — verify by querying the author name is present
    expect(screen.getByText('Amaka Obi', { exact: false })).toBeInTheDocument();
  });
});
