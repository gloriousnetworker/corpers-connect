import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginPage from '@/app/(auth)/login/page';
import * as authApi from '@/lib/api/auth';

// Mock the auth API module directly (faster and more reliable than MSW)
jest.mock('@/lib/api/auth');
jest.mock('@/lib/api/client', () => ({ default: {} }));

// Mock navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/login'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock auth store to prevent localStorage errors
jest.mock('@/store/auth.store', () => ({
  useAuthStore: () => ({
    setAuth: jest.fn(),
  }),
}));

// Mock UI store
jest.mock('@/store/ui.store', () => ({
  useUIStore: () => ({
    setTwoFAChallenge: jest.fn(),
  }),
}));

const mockUser = {
  id: 'user-123',
  firstName: 'Tunde',
  lastName: 'Adeyemi',
  email: 'tunde@gmail.com',
  stateCode: 'LA/23A/1234',
  servingState: 'Lagos',
  batch: '2023A',
  level: 'CORPER',
  subscriptionTier: 'FREE',
  isVerified: true,
  isOnboarded: true,
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

function renderLogin() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <LoginPage />
    </QueryClientProvider>
  );
}

describe('Login Page', () => {
  let mockRouter: { push: jest.Mock; replace: jest.Mock; back: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as unknown as { push: jest.Mock; replace: jest.Mock; back: jest.Mock };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

    // Default: successful login
    (authApi.login as jest.Mock).mockResolvedValue({
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh',
      user: mockUser,
    });
  });

  it('renders login form', () => {
    renderLogin();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByLabelText('Email or State Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation error when form is submitted empty', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0);
    });
  });

  it('submits and redirects on successful login', async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email or State Code'), 'user@email.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correctpassword');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/feed');
    });
  });

  it('shows error toast on invalid credentials', async () => {
    (authApi.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

    renderLogin();

    await userEvent.type(screen.getByLabelText('Email or State Code'), 'user@email.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  it('redirects to 2fa page when 2FA is required', async () => {
    (authApi.login as jest.Mock).mockResolvedValue({
      requiresTwoFactor: true,
      challengeToken: 'challenge-token',
      userId: 'user-123',
    });

    renderLogin();

    await userEvent.type(screen.getByLabelText('Email or State Code'), 'user@email.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correctpassword');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/2fa');
    });
  });

  it('has a link to the register page', () => {
    renderLogin();
    const registerLink = screen.getByRole('link', { name: /register/i });
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('has a forgot password link', () => {
    renderLogin();
    const forgotLink = screen.getByRole('link', { name: /forgot password/i });
    expect(forgotLink).toHaveAttribute('href', '/forgot-password');
  });
});
