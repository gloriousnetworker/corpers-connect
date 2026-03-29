import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/lib/api/auth', () => ({
  changePassword: jest.fn().mockResolvedValue(undefined),
  initiate2FA: jest.fn().mockResolvedValue({ qrCodeUrl: 'https://example.com/qr.png', secret: 'SECRET' }),
  confirm2FA: jest.fn().mockResolvedValue(undefined),
  disable2FA: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/api/users', () => ({
  getMe: jest.fn().mockResolvedValue({
    id: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    twoFactorEnabled: false,
    email: 'test@test.com',
    stateCode: 'LA/24A/0001',
    servingState: 'Lagos',
    batch: '2024A',
    level: 'CORPER',
    subscriptionTier: 'FREE',
    isVerified: true,
    isOnboarded: true,
    isActive: true,
    corperTag: false,
    isFirstLogin: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }),
  deleteAccount: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null; clearAuth: () => void }) => unknown) =>
    selector({ user: { id: 'user-1' }, clearAuth: jest.fn() }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), push: jest.fn() }),
}));

// next/image mock
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) =>
    React.createElement('img', { src, alt }),
}));

import AccountSettingsPage from '@/app/(app)/settings/page';
import { changePassword } from '@/lib/api/auth';
import { deleteAccount } from '@/lib/api/users';

// ── Wrapper ───────────────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AccountSettingsPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders heading and security sections', async () => {
    render(<AccountSettingsPage />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Change Password')).toBeInTheDocument();
      expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
      expect(screen.getByText('Delete Account')).toBeInTheDocument();
    });
  });

  it('calls changePassword API when form is submitted with matching passwords', async () => {
    render(<AccountSettingsPage />, { wrapper: makeWrapper() });
    await waitFor(() => screen.getByText('Change Password'));

    fireEvent.click(screen.getByText('Change Password'));
    await waitFor(() => screen.getByPlaceholderText('Current password'));

    fireEvent.change(screen.getByPlaceholderText('Current password'), { target: { value: 'OldPass@123' } });
    fireEvent.change(screen.getByPlaceholderText('New password (min 8 chars, 1 upper, 1 digit)'), { target: { value: 'NewPass@456' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'NewPass@456' } });

    fireEvent.click(screen.getByText('Update Password'));

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith({
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
      });
    });
  });

  it('shows error toast when passwords do not match (does not call API)', async () => {
    render(<AccountSettingsPage />, { wrapper: makeWrapper() });
    await waitFor(() => screen.getByText('Change Password'));

    fireEvent.click(screen.getByText('Change Password'));
    await waitFor(() => screen.getByPlaceholderText('Current password'));

    fireEvent.change(screen.getByPlaceholderText('Current password'), { target: { value: 'OldPass@123' } });
    fireEvent.change(screen.getByPlaceholderText('New password (min 8 chars, 1 upper, 1 digit)'), { target: { value: 'NewPass@456' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'Different@789' } });

    fireEvent.click(screen.getByText('Update Password'));

    // API should NOT be called
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('calls deleteAccount when DELETE is typed and button clicked', async () => {
    render(<AccountSettingsPage />, { wrapper: makeWrapper() });
    await waitFor(() => screen.getByText('Delete Account'));

    fireEvent.click(screen.getByText('Delete Account'));
    await waitFor(() => screen.getByPlaceholderText('DELETE'));

    fireEvent.change(screen.getByPlaceholderText('DELETE'), { target: { value: 'DELETE' } });
    fireEvent.click(screen.getByText('Delete My Account'));

    await waitFor(() => {
      expect(deleteAccount).toHaveBeenCalledTimes(1);
    });
  });

  it('keeps Delete My Account button disabled when confirmation text is wrong', async () => {
    render(<AccountSettingsPage />, { wrapper: makeWrapper() });
    await waitFor(() => screen.getByText('Delete Account'));

    fireEvent.click(screen.getByText('Delete Account'));
    await waitFor(() => screen.getByPlaceholderText('DELETE'));

    fireEvent.change(screen.getByPlaceholderText('DELETE'), { target: { value: 'delete' } });
    expect(screen.getByText('Delete My Account')).toBeDisabled();
  });
});
