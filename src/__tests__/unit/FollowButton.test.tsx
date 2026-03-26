import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FollowButton from '@/components/profile/FollowButton';

// Mock the API calls so no network requests go out
jest.mock('@/lib/api/users', () => ({
  followUser: jest.fn(() => Promise.resolve()),
  unfollowUser: jest.fn(() => Promise.resolve()),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('FollowButton', () => {
  it('shows "Follow" when not following', () => {
    render(<FollowButton userId="u1" isFollowing={false} />, { wrapper });
    expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument();
  });

  it('shows "Unfollow" when following', () => {
    render(<FollowButton userId="u1" isFollowing={true} />, { wrapper });
    expect(screen.getByRole('button', { name: /unfollow/i })).toBeInTheDocument();
  });

  it('calls onToggle with true when clicking Follow', () => {
    const onToggle = jest.fn();
    render(<FollowButton userId="u1" isFollowing={false} onToggle={onToggle} />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: /^follow$/i }));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('calls onToggle with false when clicking Unfollow', () => {
    const onToggle = jest.fn();
    render(<FollowButton userId="u1" isFollowing={true} onToggle={onToggle} />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: /unfollow/i }));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('applies sm size classes', () => {
    const { container } = render(<FollowButton userId="u1" isFollowing={false} size="sm" />, { wrapper });
    expect(container.innerHTML).toContain('px-3');
  });

  it('applies md size classes by default', () => {
    const { container } = render(<FollowButton userId="u1" isFollowing={false} />, { wrapper });
    expect(container.innerHTML).toContain('px-4');
  });
});
