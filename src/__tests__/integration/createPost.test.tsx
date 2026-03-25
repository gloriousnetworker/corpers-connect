import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import CreatePostModal from '@/components/post/CreatePostModal';
import { UserLevel, SubscriptionTier } from '@/types/enums';

// Mock Zustand stores
const mockSetCreatePostOpen = jest.fn();

jest.mock('@/store/ui.store', () => ({
  useUIStore: (selector: (s: { createPostOpen: boolean; setCreatePostOpen: jest.Mock }) => unknown) =>
    selector({ createPostOpen: true, setCreatePostOpen: mockSetCreatePostOpen }),
}));

const mockCurrentUser = {
  id: 'user-1',
  stateCode: 'LA/23A/0001',
  firstName: 'Tunde',
  lastName: 'Adeyemi',
  email: 'tunde@test.com',
  servingState: 'Lagos',
  batch: '2023A',
  level: UserLevel.KOPA,
  subscriptionTier: SubscriptionTier.FREE,
  isVerified: true,
  isOnboarded: true,
  isActive: true,
  corperTag: false,
  isFirstLogin: false,
  twoFactorEnabled: false,
  profilePicture: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

jest.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (s: { user: typeof mockCurrentUser | null }) => unknown) =>
    selector({ user: mockCurrentUser }),
}));

const BASE = (process.env.NEXT_PUBLIC_API_URL ||
  'https://corpers-connect-server-production.up.railway.app') + '/api/v1';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('CreatePostModal — integration', () => {
  beforeEach(() => {
    mockSetCreatePostOpen.mockClear();
  });

  it('renders when open', () => {
    render(<CreatePostModal />, { wrapper });
    expect(screen.getByText('Create Post')).toBeInTheDocument();
  });

  it('shows placeholder text with user first name', () => {
    render(<CreatePostModal />, { wrapper });
    expect(screen.getByPlaceholderText(/What's on your mind, Tunde/i)).toBeInTheDocument();
  });

  it('Post button is disabled when textarea is empty', () => {
    render(<CreatePostModal />, { wrapper });
    const postBtn = screen.getByRole('button', { name: /^Post$/i });
    expect(postBtn).toBeDisabled();
  });

  it('enables Post button when text is entered', async () => {
    const user = userEvent.setup();
    render(<CreatePostModal />, { wrapper });
    const textarea = screen.getByPlaceholderText(/What's on your mind, Tunde/i);
    await user.type(textarea, 'Hello corpers!');
    const postBtn = screen.getByRole('button', { name: /^Post$/i });
    expect(postBtn).not.toBeDisabled();
  });

  it('submits the post and calls setCreatePostOpen(false) on success', async () => {
    const user = userEvent.setup();
    render(<CreatePostModal />, { wrapper });
    const textarea = screen.getByPlaceholderText(/What's on your mind, Tunde/i);
    await user.type(textarea, 'Test post from integration test');
    const postBtn = screen.getByRole('button', { name: /^Post$/i });
    await user.click(postBtn);
    await waitFor(() => {
      expect(mockSetCreatePostOpen).toHaveBeenCalledWith(false);
    }, { timeout: 5000 });
  });

  it('shows visibility selector', () => {
    render(<CreatePostModal />, { wrapper });
    const select = screen.getByRole('combobox', { name: /Post visibility/i });
    expect(select).toBeInTheDocument();
  });

  it('renders all visibility options', () => {
    render(<CreatePostModal />, { wrapper });
    expect(screen.getByRole('option', { name: 'Public' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'My State' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Friends' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Only Me' })).toBeInTheDocument();
  });

  it('shows char counter approaching limit', async () => {
    const user = userEvent.setup();
    render(<CreatePostModal />, { wrapper });
    const textarea = screen.getByPlaceholderText(/What's on your mind, Tunde/i);
    const longText = 'a'.repeat(1700);
    // Use fireEvent for large text to avoid userEvent timeout
    const { fireEvent: fe } = await import('@testing-library/react');
    fe.change(textarea, { target: { value: longText } });
    await waitFor(() => {
      expect(screen.getByText('300')).toBeInTheDocument();
    });
  });

  it('closes immediately on submit — modal dismisses before API responds', async () => {
    server.use(
      http.post(`${BASE}/posts`, () =>
        HttpResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 })
      )
    );

    const user = userEvent.setup();
    render(<CreatePostModal />, { wrapper });
    const textarea = screen.getByPlaceholderText(/What's on your mind, Tunde/i);
    await user.type(textarea, 'Test post');
    const postBtn = screen.getByRole('button', { name: /^Post$/i });
    await user.click(postBtn);
    // Modal closes immediately on submit regardless of the API outcome
    await waitFor(() => {
      expect(mockSetCreatePostOpen).toHaveBeenCalledWith(false);
    }, { timeout: 5000 });
  });
});
