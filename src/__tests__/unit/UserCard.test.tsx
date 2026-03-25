import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserCard from '@/components/profile/UserCard';
import { UserLevel, SubscriptionTier } from '@/types/enums';

jest.mock('@/lib/api/users', () => ({
  followUser: jest.fn(() => Promise.resolve()),
  unfollowUser: jest.fn(() => Promise.resolve()),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const mockUser = {
  id: 'u1',
  firstName: 'Emeka',
  lastName: 'Chukwu',
  profilePicture: null as string | null | undefined,
  level: UserLevel.KOPA,
  isVerified: false,
  servingState: 'Anambra',
  subscriptionTier: SubscriptionTier.FREE,
  isFollowing: false,
};

describe('UserCard', () => {
  it('renders user full name', () => {
    render(<UserCard user={mockUser} />, { wrapper });
    expect(screen.getByText('Emeka Chukwu')).toBeInTheDocument();
  });

  it('renders initials when no profile picture', () => {
    render(<UserCard user={mockUser} />, { wrapper });
    expect(screen.getByText('EC')).toBeInTheDocument();
  });

  it('renders servingState', () => {
    render(<UserCard user={mockUser} />, { wrapper });
    expect(screen.getByText('Anambra')).toBeInTheDocument();
  });

  it('shows FollowButton by default', () => {
    render(<UserCard user={mockUser} />, { wrapper });
    expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument();
  });

  it('hides FollowButton when showFollow=false', () => {
    render(<UserCard user={mockUser} showFollow={false} />, { wrapper });
    expect(screen.queryByRole('button', { name: /follow/i })).not.toBeInTheDocument();
  });

  it('calls onClick when card is tapped', () => {
    const onClick = jest.fn();
    render(<UserCard user={mockUser} onClick={onClick} />, { wrapper });
    // The clickable area is the inner button (name/avatar area)
    const buttons = screen.getAllByRole('button');
    // First button is the user info, last is the follow button
    fireEvent.click(buttons[0]);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows verified badge when isVerified=true', () => {
    const { container } = render(
      <UserCard user={{ ...mockUser, isVerified: true }} />,
      { wrapper }
    );
    // BadgeCheck renders an SVG — at least one SVG should be present
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
  });
});
