/**
 * Unit tests for marketplace components — CategoryChips, PriceInput, ListingCard
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListingCategory, ListingType, ListingStatus, UserLevel, SubscriptionTier } from '@/types/enums';
import type { MarketplaceListing } from '@/types/models';
import CategoryChips from '@/components/marketplace/CategoryChips';
import PriceInput from '@/components/marketplace/PriceInput';
import ListingCard from '@/components/marketplace/ListingCard';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeListing = (overrides: Partial<MarketplaceListing> = {}): MarketplaceListing => ({
  id: 'listing-1',
  sellerId: 'user-1',
  seller: {
    id: 'user-1',
    stateCode: 'LA/23A/0001',
    firstName: 'Chidi',
    lastName: 'Nwosu',
    email: 'chidi@test.com',
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
  title: 'Khaki Uniform (Size L)',
  description: 'Barely used khaki uniform in good condition.',
  category: ListingCategory.UNIFORM,
  price: 5000,
  listingType: ListingType.FOR_SALE,
  images: [],
  location: 'Calabar',
  servingState: 'Cross River',
  status: ListingStatus.ACTIVE,
  isBoost: false,
  viewCount: 12,
  createdAt: '2024-06-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
  ...overrides,
});

// ── CategoryChips ─────────────────────────────────────────────────────────────

describe('CategoryChips', () => {
  it('renders all category buttons', () => {
    const onChange = jest.fn();
    render(<CategoryChips selected="ALL" onChange={onChange} />);
    expect(screen.getByTestId('category-chips')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Housing')).toBeInTheDocument();
    expect(screen.getByText('Uniform')).toBeInTheDocument();
  });

  it('highlights the selected category', () => {
    const onChange = jest.fn();
    render(<CategoryChips selected={ListingCategory.UNIFORM} onChange={onChange} />);
    const uniformBtn = screen.getByText('Uniform').closest('button')!;
    expect(uniformBtn.className).toContain('bg-primary');
  });

  it('calls onChange when a chip is clicked', () => {
    const onChange = jest.fn();
    render(<CategoryChips selected="ALL" onChange={onChange} />);
    fireEvent.click(screen.getByText('Housing'));
    expect(onChange).toHaveBeenCalledWith(ListingCategory.HOUSING);
  });

  it('calls onChange with ALL when All chip is clicked', () => {
    const onChange = jest.fn();
    render(<CategoryChips selected={ListingCategory.FOOD} onChange={onChange} />);
    fireEvent.click(screen.getByText('All'));
    expect(onChange).toHaveBeenCalledWith('ALL');
  });
});

// ── PriceInput ────────────────────────────────────────────────────────────────

describe('PriceInput', () => {
  it('renders with Naira prefix', () => {
    render(<PriceInput value="" onChange={() => {}} />);
    expect(screen.getByTestId('price-input')).toBeInTheDocument();
    expect(screen.getByText('₦')).toBeInTheDocument();
  });

  it('renders the label', () => {
    render(<PriceInput value="" onChange={() => {}} label="Price (₦)" />);
    expect(screen.getByText('Price (₦)')).toBeInTheDocument();
  });

  it('calls onChange with numeric-only value on input', () => {
    const onChange = jest.fn();
    render(<PriceInput value="" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '5000' } });
    expect(onChange).toHaveBeenCalledWith('5000');
  });

  it('strips non-numeric characters', () => {
    const onChange = jest.fn();
    render(<PriceInput value="" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abc123def' } });
    expect(onChange).toHaveBeenCalledWith('123');
  });

  it('shows required asterisk when required=true', () => {
    render(<PriceInput value="" onChange={() => {}} required label="Amount" />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('formats value with commas', () => {
    render(<PriceInput value="5000" onChange={() => {}} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('5,000');
  });
});

// ── ListingCard ───────────────────────────────────────────────────────────────

describe('ListingCard', () => {
  it('renders listing title and price', () => {
    const listing = makeListing();
    const onClick = jest.fn();
    render(<ListingCard listing={listing} onClick={onClick} />);

    expect(screen.getByTestId('listing-card')).toBeInTheDocument();
    expect(screen.getByText('Khaki Uniform (Size L)')).toBeInTheDocument();
    expect(screen.getByText(/5,000/)).toBeInTheDocument();
  });

  it('calls onClick with the listing when clicked', () => {
    const listing = makeListing();
    const onClick = jest.fn();
    render(<ListingCard listing={listing} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('listing-card'));
    expect(onClick).toHaveBeenCalledWith(listing);
  });

  it('shows "Free" when price is null', () => {
    const listing = makeListing({ price: null, listingType: ListingType.FREE });
    render(<ListingCard listing={listing} onClick={jest.fn()} />);
    // Both the type badge and price label show "Free"
    expect(screen.getAllByText('Free').length).toBeGreaterThanOrEqual(1);
  });

  it('shows SOLD overlay when status is SOLD', () => {
    const listing = makeListing({ status: ListingStatus.SOLD });
    render(<ListingCard listing={listing} onClick={jest.fn()} />);
    expect(screen.getByText('SOLD')).toBeInTheDocument();
  });

  it('shows boost badge when isBoost=true', () => {
    const listing = makeListing({ isBoost: true });
    render(<ListingCard listing={listing} onClick={jest.fn()} />);
    expect(screen.getByText(/BOOST/i)).toBeInTheDocument();
  });

  it('shows correct type badge', () => {
    const listing = makeListing({ listingType: ListingType.FOR_RENT });
    render(<ListingCard listing={listing} onClick={jest.fn()} />);
    expect(screen.getByText('For Rent')).toBeInTheDocument();
  });

  it('shows location when provided', () => {
    const listing = makeListing({ location: 'Calabar' });
    render(<ListingCard listing={listing} onClick={jest.fn()} />);
    expect(screen.getByText('Calabar')).toBeInTheDocument();
  });

  it('shows view count', () => {
    const listing = makeListing({ viewCount: 42 });
    render(<ListingCard listing={listing} onClick={jest.fn()} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
