import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import RegisterPage from '@/app/(auth)/register/page';
import * as authApi from '@/lib/api/auth';

jest.mock('@/lib/api/auth');
jest.mock('@/lib/api/client', () => ({ default: {} }));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/register'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock UI store
jest.mock('@/store/ui.store', () => ({
  useUIStore: () => ({
    setRegistration: jest.fn(),
    registration: { stateCode: '', password: '', nyscData: null, otpToken: '', maskedEmail: '' },
    clearRegistration: jest.fn(),
  }),
}));

function renderRegister() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RegisterPage />
    </QueryClientProvider>
  );
}

describe('Register Page (Step 1)', () => {
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

    // Default: successful initiate
    (authApi.registerInitiate as jest.Mock).mockResolvedValue({
      otpToken: 'otp-token-123',
      email: 'tunde@gmail.com',
      maskedEmail: 't***@gmail.com',
    });
  });

  it('renders registration form', () => {
    renderRegister();
    expect(screen.getByText('Create account')).toBeInTheDocument();
    expect(screen.getByLabelText(/nysc state code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/create password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid state code', async () => {
    renderRegister();

    await userEvent.type(screen.getByLabelText(/nysc state code/i), 'INVALID');
    await userEvent.type(screen.getByLabelText(/create password/i), 'MyP@ss1word');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'MyP@ss1word');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid format/i)).toBeInTheDocument();
    });
  });

  it('shows password strength indicator as user types', async () => {
    renderRegister();
    const passwordInput = screen.getByLabelText(/create password/i);
    await userEvent.type(passwordInput, 'MyP@ss1word');
    expect(screen.getByText(/password strength/i)).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    renderRegister();

    await userEvent.type(screen.getByLabelText(/nysc state code/i), 'LA/23A/1234');
    await userEvent.type(screen.getByLabelText(/create password/i), 'MyP@ss1word');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'DifferentPass1!');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('advances to confirm step on success', async () => {
    renderRegister();

    await userEvent.type(screen.getByLabelText(/nysc state code/i), 'LA/23A/1234');
    await userEvent.type(screen.getByLabelText(/create password/i), 'MyP@ss1word');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'MyP@ss1word');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/register/confirm');
    });
  });

  it('has a link to login page', () => {
    renderRegister();
    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
