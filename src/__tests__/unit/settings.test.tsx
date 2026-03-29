/**
 * Unit tests for Settings page sections — ChangePassword, TwoFA,
 * Sessions, BlockList, NotificationPrefs, Appearance, DeleteAccount, Logout
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn() }),
}));

jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: jest.fn() }),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/api/auth', () => ({
  changePassword: jest.fn(),
  initiate2FA: jest.fn(),
  confirm2FA: jest.fn(),
  disable2FA: jest.fn(),
  getSessions: jest.fn().mockResolvedValue([]),
  revokeSession: jest.fn(),
  revokeAllSessions: jest.fn(),
  logout: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/api/users', () => ({
  getMe: jest.fn().mockResolvedValue({
    id: 'u1',
    firstName: 'Ada',
    lastName: 'Okafor',
    email: 'ada@test.com',
    stateCode: 'NYC001',
    servingState: 'Lagos',
    batch: '2024A',
    level: 'OTONDO',
    isVerified: false,
    subscriptionTier: 'FREE',
    twoFactorEnabled: false,
    isOnboarded: true,
    isActive: true,
    isFirstLogin: false,
    corperTag: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
  getBlockedUsers: jest.fn().mockResolvedValue([]),
  deleteAccount: jest.fn(),
  unblockUser: jest.fn(),
}));

jest.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (s: { clearAuth: jest.Mock }) => unknown) =>
    selector({ clearAuth: jest.fn() }),
}));

jest.mock('@/lib/utils', () => ({
  getInitials: (f: string, l: string) => `${f[0]}${l[0]}`.toUpperCase(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = makeQueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

async function getSettingsPage() {
  const mod = await import('@/app/(app)/settings/page');
  return mod.default;
}

// Wait for the page body (inside isLoading gate) to appear
async function renderPageAndWait() {
  const Page = await getSettingsPage();
  render(<Wrapper><Page /></Wrapper>);
  // Wait for an element that only appears when isLoading = false
  return screen.findByText('Change Password');
}

// ── ChangePasswordSection ────────────────────────────────────────────────────

describe('ChangePasswordSection', () => {
  it('renders Change Password button', async () => {
    await renderPageAndWait();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });

  it('expands the form on click', async () => {
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Change Password').closest('button')!);
    expect(screen.getByPlaceholderText('Current password')).toBeInTheDocument();
  });

  it('shows error when new password is too short', async () => {
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Change Password').closest('button')!);
    fireEvent.change(screen.getByPlaceholderText('Current password'), { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByPlaceholderText('New password (min 8 chars, 1 upper, 1 digit)'), { target: { value: 'short' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));
    expect(toast.error).toHaveBeenCalledWith('Password must be at least 8 characters');
  });

  it('shows error when new password lacks uppercase', async () => {
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Change Password').closest('button')!);
    fireEvent.change(screen.getByPlaceholderText('Current password'), { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByPlaceholderText('New password (min 8 chars, 1 upper, 1 digit)'), { target: { value: 'lowercase1' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'lowercase1' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));
    expect(toast.error).toHaveBeenCalledWith('Password must contain an uppercase letter');
  });

  it('shows error when new password lacks a digit', async () => {
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Change Password').closest('button')!);
    fireEvent.change(screen.getByPlaceholderText('Current password'), { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByPlaceholderText('New password (min 8 chars, 1 upper, 1 digit)'), { target: { value: 'NoDigitHere' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'NoDigitHere' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));
    expect(toast.error).toHaveBeenCalledWith('Password must contain a number');
  });

  it('shows error when passwords do not match', async () => {
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Change Password').closest('button')!);
    fireEvent.change(screen.getByPlaceholderText('Current password'), { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByPlaceholderText('New password (min 8 chars, 1 upper, 1 digit)'), { target: { value: 'Newpass1' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'Different1' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));
    expect(toast.error).toHaveBeenCalledWith('Passwords do not match');
  });

  it('toggles current password visibility', async () => {
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Change Password').closest('button')!);
    const input = screen.getByPlaceholderText('Current password');
    expect(input).toHaveAttribute('type', 'password');
    // First "Show password" button belongs to current password field
    const showBtns = screen.getAllByLabelText('Show password');
    fireEvent.click(showBtns[0]);
    expect(input).toHaveAttribute('type', 'text');
  });

  it('has correct testid', async () => {
    await renderPageAndWait();
    expect(screen.getByTestId('change-password-section')).toBeInTheDocument();
  });
});

// ── TwoFASection ──────────────────────────────────────────────────────────────

describe('TwoFASection', () => {
  it('renders with "Not enabled" status when 2FA is off', async () => {
    await renderPageAndWait();
    expect(screen.getByText('Not enabled')).toBeInTheDocument();
  });

  it('renders the 2FA section button', async () => {
    await renderPageAndWait();
    expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
  });

  it('has correct testid', async () => {
    await renderPageAndWait();
    expect(screen.getByTestId('twofa-section')).toBeInTheDocument();
  });

  it('expands on click and shows TOTP input', async () => {
    const { initiate2FA } = await import('@/lib/api/auth');
    (initiate2FA as jest.Mock).mockResolvedValueOnce({ qrCodeUrl: 'https://example.com/qr.png', secret: 'ABC' });
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Two-Factor Authentication').closest('button')!);
    expect(await screen.findByPlaceholderText('Enter 6-digit code')).toBeInTheDocument();
  });
});

// ── SessionsSection ───────────────────────────────────────────────────────────

describe('SessionsSection', () => {
  it('renders the sessions section', async () => {
    await renderPageAndWait();
    expect(screen.getByText('Active Sessions')).toBeInTheDocument();
  });

  it('has correct testid', async () => {
    await renderPageAndWait();
    expect(screen.getByTestId('sessions-section')).toBeInTheDocument();
  });

  it('shows "No sessions found" when empty', async () => {
    const { getSessions } = await import('@/lib/api/auth');
    (getSessions as jest.Mock).mockResolvedValueOnce([]);
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Active Sessions').closest('button')!);
    expect(await screen.findByText('No sessions found')).toBeInTheDocument();
  });

  it('shows a session device info when loaded', async () => {
    const { getSessions } = await import('@/lib/api/auth');
    (getSessions as jest.Mock).mockResolvedValueOnce([
      { id: 's1', deviceInfo: 'Chrome on Windows', ipAddress: '127.0.0.1', createdAt: new Date().toISOString(), expiresAt: new Date().toISOString(), isCurrent: true },
    ]);
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Active Sessions').closest('button')!);
    expect(await screen.findByText('Chrome on Windows')).toBeInTheDocument();
  });

  it('shows "This device" badge for current session', async () => {
    const { getSessions } = await import('@/lib/api/auth');
    (getSessions as jest.Mock).mockResolvedValueOnce([
      { id: 's1', deviceInfo: 'Firefox', ipAddress: null, createdAt: new Date().toISOString(), expiresAt: new Date().toISOString(), isCurrent: true },
    ]);
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Active Sessions').closest('button')!);
    expect(await screen.findByText('This device')).toBeInTheDocument();
  });

  it('shows Revoke button for non-current sessions', async () => {
    const { getSessions } = await import('@/lib/api/auth');
    (getSessions as jest.Mock).mockResolvedValueOnce([
      { id: 's1', deviceInfo: 'Safari on iPhone', ipAddress: null, createdAt: new Date().toISOString(), expiresAt: new Date().toISOString(), isCurrent: false },
    ]);
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Active Sessions').closest('button')!);
    expect(await screen.findByText('Safari on iPhone')).toBeInTheDocument();
    expect(screen.getByText('Revoke')).toBeInTheDocument();
  });

  it('does not show Revoke button for current session', async () => {
    const { getSessions } = await import('@/lib/api/auth');
    (getSessions as jest.Mock).mockResolvedValueOnce([
      { id: 's1', deviceInfo: 'Chrome', ipAddress: null, createdAt: new Date().toISOString(), expiresAt: new Date().toISOString(), isCurrent: true },
    ]);
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Active Sessions').closest('button')!);
    await screen.findByText('This device');
    expect(screen.queryByText('Revoke')).not.toBeInTheDocument();
  });
});

// ── BlockListSection ──────────────────────────────────────────────────────────

describe('BlockListSection', () => {
  it('renders the blocked users section', async () => {
    await renderPageAndWait();
    expect(screen.getByText('Blocked Users')).toBeInTheDocument();
  });

  it('has correct testid', async () => {
    await renderPageAndWait();
    expect(screen.getByTestId('block-list-section')).toBeInTheDocument();
  });

  it('shows empty state when no blocked users', async () => {
    const { getBlockedUsers } = await import('@/lib/api/users');
    (getBlockedUsers as jest.Mock).mockResolvedValueOnce([]);
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Blocked Users').closest('button')!);
    expect(await screen.findByText("You haven't blocked anyone")).toBeInTheDocument();
  });

  it('shows blocked user name', async () => {
    const { getBlockedUsers } = await import('@/lib/api/users');
    (getBlockedUsers as jest.Mock).mockResolvedValueOnce([
      {
        id: 'u2', firstName: 'Chidi', lastName: 'Nwosu', servingState: 'Anambra',
        stateCode: 'ANA001', email: 'c@t.com', batch: '2024A', level: 'OTONDO',
        isVerified: false, subscriptionTier: 'FREE', twoFactorEnabled: false,
        isOnboarded: true, isActive: true, isFirstLogin: false, corperTag: false,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
    ]);
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Blocked Users').closest('button')!);
    expect(await screen.findByText('Chidi Nwosu')).toBeInTheDocument();
  });

  it('shows Unblock button for each blocked user', async () => {
    const { getBlockedUsers } = await import('@/lib/api/users');
    (getBlockedUsers as jest.Mock).mockResolvedValueOnce([
      {
        id: 'u2', firstName: 'Chidi', lastName: 'Nwosu', servingState: 'Anambra',
        stateCode: 'ANA001', email: 'c@t.com', batch: '2024A', level: 'OTONDO',
        isVerified: false, subscriptionTier: 'FREE', twoFactorEnabled: false,
        isOnboarded: true, isActive: true, isFirstLogin: false, corperTag: false,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
    ]);
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Blocked Users').closest('button')!);
    await screen.findByText('Chidi Nwosu');
    expect(screen.getByRole('button', { name: /Unblock/i })).toBeInTheDocument();
  });
});

// ── NotificationPrefsSection ──────────────────────────────────────────────────

describe('NotificationPrefsSection', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders notification prefs section', async () => {
    await renderPageAndWait();
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
  });

  it('has correct testid', async () => {
    await renderPageAndWait();
    expect(screen.getByTestId('notif-prefs-section')).toBeInTheDocument();
  });

  it('expands and shows all 6 notification type labels', async () => {
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Notification Preferences').closest('button')!);
    expect(screen.getByText('New follower')).toBeInTheDocument();
    expect(screen.getByText('Post likes')).toBeInTheDocument();
    expect(screen.getByText('Post comments')).toBeInTheDocument();
    expect(screen.getByText('Mentions')).toBeInTheDocument();
    expect(screen.getByText('Direct messages')).toBeInTheDocument();
    expect(screen.getByText('Market inquiries')).toBeInTheDocument();
  });

  it('all 6 toggles are on by default', async () => {
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Notification Preferences').closest('button')!);
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBe(6);
    switches.forEach((sw) => expect(sw).toHaveAttribute('aria-checked', 'true'));
  });

  it('toggling a switch updates aria-checked to false', async () => {
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Notification Preferences').closest('button')!);
    const firstSwitch = screen.getAllByRole('switch')[0];
    expect(firstSwitch).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(firstSwitch);
    expect(firstSwitch).toHaveAttribute('aria-checked', 'false');
  });

  it('toggling a switch back on updates aria-checked to true', async () => {
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Notification Preferences').closest('button')!);
    const firstSwitch = screen.getAllByRole('switch')[0];
    fireEvent.click(firstSwitch);
    expect(firstSwitch).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(firstSwitch);
    expect(firstSwitch).toHaveAttribute('aria-checked', 'true');
  });

  it('persists toggle off state to localStorage', async () => {
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Notification Preferences').closest('button')!);
    fireEvent.click(screen.getAllByRole('switch')[0]);
    const saved = JSON.parse(localStorage.getItem('cc_notif_prefs') ?? '{}');
    expect(saved.FOLLOW).toBe(false);
  });

  it('persists all enabled state correctly', async () => {
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Notification Preferences').closest('button')!);
    // Toggle DM_RECEIVED (index 4) off
    fireEvent.click(screen.getAllByRole('switch')[4]);
    const saved = JSON.parse(localStorage.getItem('cc_notif_prefs') ?? '{}');
    expect(saved.DM_RECEIVED).toBe(false);
    expect(saved.FOLLOW).toBe(true);
  });
});

// ── AppearanceSection ─────────────────────────────────────────────────────────

describe('AppearanceSection', () => {
  it('renders appearance section header', async () => {
    await renderPageAndWait();
    expect(screen.getByTestId('appearance-section')).toBeInTheDocument();
  });

  it('has correct testid', async () => {
    await renderPageAndWait();
    expect(screen.getByTestId('appearance-section')).toBeInTheDocument();
  });

  it('renders Light, Dark, System buttons', async () => {
    await renderPageAndWait();
    expect(screen.getByRole('button', { name: 'Light' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dark' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'System' })).toBeInTheDocument();
  });

  it('Light button has active (bg-primary) styling when theme is light', async () => {
    await renderPageAndWait();
    const lightBtn = screen.getByRole('button', { name: 'Light' });
    expect(lightBtn.className).toMatch(/bg-primary/);
  });

  it('Dark and System buttons do not have active styling when theme is light', async () => {
    await renderPageAndWait();
    const darkBtn = screen.getByRole('button', { name: 'Dark' });
    const systemBtn = screen.getByRole('button', { name: 'System' });
    expect(darkBtn.className).not.toMatch(/\bbg-primary\b/);
    expect(systemBtn.className).not.toMatch(/\bbg-primary\b/);
  });
});

// ── DeleteAccountSection ──────────────────────────────────────────────────────

describe('DeleteAccountSection', () => {
  it('renders delete account section', async () => {
    await renderPageAndWait();
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
  });

  it('has correct testid', async () => {
    await renderPageAndWait();
    expect(screen.getByTestId('delete-account-section')).toBeInTheDocument();
  });

  it('expands the confirmation form on click', async () => {
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Delete Account').closest('button')!);
    expect(screen.getByPlaceholderText('DELETE')).toBeInTheDocument();
  });

  it('delete button is disabled until "DELETE" is typed', async () => {
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Delete Account').closest('button')!);
    const deleteBtn = screen.getByRole('button', { name: /Delete My Account/i });
    expect(deleteBtn).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('DELETE'), { target: { value: 'DELETE' } });
    expect(deleteBtn).toBeEnabled();
  });

  it('delete button is disabled for partial input', async () => {
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Delete Account').closest('button')!);
    const deleteBtn = screen.getByRole('button', { name: /Delete My Account/i });
    fireEvent.change(screen.getByPlaceholderText('DELETE'), { target: { value: 'DELET' } });
    expect(deleteBtn).toBeDisabled();
  });

  it('shows warning about irreversible action', async () => {
    await renderPageAndWait();
    fireEvent.click(screen.getByText('Delete Account').closest('button')!);
    expect(screen.getByText('This action is irreversible')).toBeInTheDocument();
  });
});

// ── LogoutButton ──────────────────────────────────────────────────────────────

describe('LogoutButton', () => {
  it('renders Sign Out button', async () => {
    await renderPageAndWait();
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('calls logout API on click', async () => {
    const { logout: logoutFn } = await import('@/lib/api/auth');
    (logoutFn as jest.Mock).mockResolvedValueOnce(undefined);
    await renderPageAndWait();
    fireEvent.click(screen.getByTestId('logout-button'));
    await waitFor(() => expect(logoutFn).toHaveBeenCalledTimes(1));
  });
});

// ── AccountSettingsPage structure ─────────────────────────────────────────────

describe('AccountSettingsPage structure', () => {
  it('renders the page title in the header', async () => {
    const Page = await getSettingsPage();
    render(<Wrapper><Page /></Wrapper>);
    expect(await screen.findByText('Settings')).toBeInTheDocument();
  });

  it('renders all section labels after data loads', async () => {
    await renderPageAndWait();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByTestId('appearance-section')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
  });

  it('renders all main settings items after data loads', async () => {
    await renderPageAndWait();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
    expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
    expect(screen.getByText('Active Sessions')).toBeInTheDocument();
    expect(screen.getByText('Blocked Users')).toBeInTheDocument();
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
  });

  it('renders the back button', async () => {
    const Page = await getSettingsPage();
    render(<Wrapper><Page /></Wrapper>);
    await screen.findByText('Settings');
    expect(screen.getByLabelText('Back')).toBeInTheDocument();
  });
});
