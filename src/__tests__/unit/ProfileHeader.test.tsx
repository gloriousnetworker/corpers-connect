import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { UserLevel, SubscriptionTier } from '@/types/enums';
import type { User } from '@/types/models';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  stateCode: 'LA/23A/0001',
  firstName: 'Amaka',
  lastName: 'Obi',
  email: 'amaka@test.com',
  servingState: 'Lagos',
  lga: 'Ikeja',
  ppa: 'Lagos State University',
  batch: '2023A',
  bio: 'Serving proudly',
  profilePicture: null,
  corperTag: false,
  corperTagLabel: null,
  level: UserLevel.KOPA,
  isVerified: false,
  subscriptionTier: SubscriptionTier.FREE,
  isOnboarded: true,
  isActive: true,
  isFirstLogin: false,
  twoFactorEnabled: false,
  followersCount: 42,
  followingCount: 18,
  postsCount: 7,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('ProfileHeader', () => {
  it('renders full name', () => {
    render(<ProfileHeader user={makeUser()} />);
    expect(screen.getByText('Amaka Obi')).toBeInTheDocument();
  });

  it('renders bio when present', () => {
    render(<ProfileHeader user={makeUser()} />);
    expect(screen.getByText('Serving proudly')).toBeInTheDocument();
  });

  it('does not render bio when absent', () => {
    render(<ProfileHeader user={makeUser({ bio: null })} />);
    expect(screen.queryByText('Serving proudly')).not.toBeInTheDocument();
  });

  it('renders verified badge when isVerified=true', () => {
    render(<ProfileHeader user={makeUser({ isVerified: true })} />);
    expect(screen.getByLabelText('Verified')).toBeInTheDocument();
  });

  it('does not render verified badge when isVerified=false', () => {
    render(<ProfileHeader user={makeUser({ isVerified: false })} />);
    expect(screen.queryByLabelText('Verified')).not.toBeInTheDocument();
  });

  it('renders level badge', () => {
    render(<ProfileHeader user={makeUser({ level: UserLevel.CORPER })} />);
    expect(screen.getByText('Corper')).toBeInTheDocument();
  });

  it('renders corper tag badge when corperTag=true', () => {
    render(<ProfileHeader user={makeUser({ corperTag: true, corperTagLabel: 'Batch B' })} />);
    expect(screen.getByText('Batch B')).toBeInTheDocument();
  });

  it('renders followers count', () => {
    render(<ProfileHeader user={makeUser({ followersCount: 42 })} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Followers')).toBeInTheDocument();
  });

  it('renders following count', () => {
    render(<ProfileHeader user={makeUser({ followingCount: 18 })} />);
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('Following')).toBeInTheDocument();
  });

  it('renders posts count', () => {
    render(<ProfileHeader user={makeUser({ postsCount: 7 })} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Posts')).toBeInTheDocument();
  });

  it('shows Edit Profile button for own profile', () => {
    render(<ProfileHeader user={makeUser()} isOwnProfile={true} onEditClick={jest.fn()} />);
    expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
  });

  it('does not show Edit Profile button for other profile', () => {
    render(<ProfileHeader user={makeUser()} isOwnProfile={false} />);
    expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument();
  });

  it('calls onEditClick when Edit Profile is pressed', () => {
    const onEditClick = jest.fn();
    render(<ProfileHeader user={makeUser()} isOwnProfile={true} onEditClick={onEditClick} />);
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
    expect(onEditClick).toHaveBeenCalledTimes(1);
  });

  it('calls onFollowersClick when Followers is pressed', () => {
    const onFollowersClick = jest.fn();
    render(
      <ProfileHeader
        user={makeUser()}
        isOwnProfile={true}
        onFollowersClick={onFollowersClick}
        onFollowingClick={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('Followers').closest('button')!);
    expect(onFollowersClick).toHaveBeenCalledTimes(1);
  });

  it('calls onFollowingClick when Following is pressed', () => {
    const onFollowingClick = jest.fn();
    render(
      <ProfileHeader
        user={makeUser()}
        isOwnProfile={true}
        onFollowersClick={jest.fn()}
        onFollowingClick={onFollowingClick}
      />
    );
    fireEvent.click(screen.getByText('Following').closest('button')!);
    expect(onFollowingClick).toHaveBeenCalledTimes(1);
  });

  it('renders actionSlot for other user profile', () => {
    render(
      <ProfileHeader
        user={makeUser()}
        isOwnProfile={false}
        actionSlot={<button>Follow</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument();
  });

  it('renders stateCode and batch info', () => {
    render(<ProfileHeader user={makeUser()} />);
    expect(screen.getByText(/LA\/23A\/0001/)).toBeInTheDocument();
    expect(screen.getByText(/2023A/)).toBeInTheDocument();
    expect(screen.getByText(/Lagos/)).toBeInTheDocument();
  });

  it('shows initials when no profile picture', () => {
    render(<ProfileHeader user={makeUser({ profilePicture: null })} />);
    expect(screen.getByText('AO')).toBeInTheDocument();
  });
});
