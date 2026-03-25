import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationItem from '@/components/profile/NotificationItem';
import { NotificationType, UserLevel, SubscriptionTier } from '@/types/enums';
import type { Notification } from '@/types/models';

const actor = {
  id: 'actor-1',
  firstName: 'Ngozi',
  lastName: 'Eze',
  email: 'ngozi@test.com',
  stateCode: 'EN/23A/0001',
  servingState: 'Enugu',
  batch: '2023A',
  level: UserLevel.KOPA,
  subscriptionTier: SubscriptionTier.FREE,
  isVerified: false,
  isOnboarded: true,
  isActive: true,
  corperTag: false,
  isFirstLogin: false,
  twoFactorEnabled: false,
  profilePicture: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const makeNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'n1',
  recipientId: 'me',
  actorId: actor.id,
  actor,
  type: NotificationType.FOLLOW,
  entityType: null,
  entityId: null,
  content: 'started following you',
  isRead: false,
  createdAt: new Date(Date.now() - 60_000).toISOString(),
  ...overrides,
});

describe('NotificationItem', () => {
  it('renders actor name', () => {
    render(<NotificationItem notification={makeNotification()} />);
    expect(screen.getByText(/Ngozi Eze/)).toBeInTheDocument();
  });

  it('renders notification content', () => {
    render(<NotificationItem notification={makeNotification()} />);
    expect(screen.getByText(/started following you/)).toBeInTheDocument();
  });

  it('shows unread dot when isRead=false', () => {
    const { container } = render(<NotificationItem notification={makeNotification({ isRead: false })} />);
    expect(container.innerHTML).toContain('bg-primary');
  });

  it('does not show unread dot when isRead=true', () => {
    const { container } = render(<NotificationItem notification={makeNotification({ isRead: true })} />);
    // Background highlight and dot are removed
    expect(container.querySelector('.bg-primary.rounded-full')).not.toBeInTheDocument();
  });

  it('calls onPress when clicked', () => {
    const onPress = jest.fn();
    render(<NotificationItem notification={makeNotification()} onPress={onPress} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders relative time', () => {
    render(<NotificationItem notification={makeNotification()} />);
    // Should show something time-related (e.g. "1 minute ago")
    expect(screen.getByText(/minute|second|hour|ago/i)).toBeInTheDocument();
  });

  it('renders system notification without actor', () => {
    render(
      <NotificationItem
        notification={makeNotification({
          actorId: null,
          actor: null,
          type: NotificationType.SYSTEM,
          content: 'System maintenance scheduled',
        })}
      />
    );
    expect(screen.getByText(/System maintenance scheduled/)).toBeInTheDocument();
  });
});
