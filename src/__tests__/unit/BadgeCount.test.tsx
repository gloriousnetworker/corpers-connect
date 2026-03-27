/**
 * Tests for the unread notification badge count shown in TopBar and DesktopSideNav.
 * These components read `unreadNotifications` from UIStore.
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { useUIStore } from '@/store/ui.store';

// ── Minimal stub components to test badge rendering logic ──────────────────

function BadgeStub({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span data-testid="badge">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function TopBarStub() {
  const unread = useUIStore((s) => s.unreadNotifications);
  return <BadgeStub count={unread} />;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function resetStore() {
  act(() => {
    useUIStore.getState().setUnreadNotifications(0);
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Notification badge count', () => {
  beforeEach(resetStore);

  it('shows no badge when unread count is 0', () => {
    render(<TopBarStub />);
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  it('shows badge with correct count', () => {
    act(() => useUIStore.getState().setUnreadNotifications(5));
    render(<TopBarStub />);
    expect(screen.getByTestId('badge')).toHaveTextContent('5');
  });

  it('caps display at 99+', () => {
    act(() => useUIStore.getState().setUnreadNotifications(150));
    render(<TopBarStub />);
    expect(screen.getByTestId('badge')).toHaveTextContent('99+');
  });

  it('incrementUnread increases count by 1', () => {
    act(() => {
      useUIStore.getState().setUnreadNotifications(3);
      useUIStore.getState().incrementUnread();
    });
    expect(useUIStore.getState().unreadNotifications).toBe(4);
  });

  it('setUnreadNotifications(0) removes badge', () => {
    act(() => useUIStore.getState().setUnreadNotifications(10));
    const { rerender } = render(<TopBarStub />);
    expect(screen.getByTestId('badge')).toBeInTheDocument();

    act(() => useUIStore.getState().setUnreadNotifications(0));
    rerender(<TopBarStub />);
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  it('shows badge of exactly 99 without capping', () => {
    act(() => useUIStore.getState().setUnreadNotifications(99));
    render(<TopBarStub />);
    expect(screen.getByTestId('badge')).toHaveTextContent('99');
  });
});
