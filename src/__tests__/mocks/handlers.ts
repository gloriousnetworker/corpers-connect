import { http, HttpResponse } from 'msw';

// Must match the base URL constructed by the API client:
// API_URL (from constants.ts) + '/api/v1'
// Default in tests = 'https://corpers-connect-server-production.up.railway.app/api/v1'
const BASE = (process.env.NEXT_PUBLIC_API_URL ||
  'https://corpers-connect-server-production.up.railway.app') + '/api/v1';

const API_URL = BASE;

const mockUser = {
  id: 'user-123',
  stateCode: 'LA/23A/1234',
  firstName: 'Tunde',
  lastName: 'Adeyemi',
  email: 't***@gmail.com',
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

export const handlers = [
  // Login — success
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { identifier: string; password: string };
    if (body.password === 'wrongpassword') {
      return HttpResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: mockUser,
      },
    });
  }),

  // Login — 2FA required
  http.post(`${API_URL}/auth/login/2fa`, async () => {
    return HttpResponse.json({
      success: true,
      data: {
        requiresTwoFactor: true,
        challengeToken: 'challenge-token-123',
        userId: 'user-123',
      },
    });
  }),

  // Register initiate
  http.post(`${API_URL}/auth/register/initiate`, async () => {
    return HttpResponse.json({
      success: true,
      data: {
        otpToken: 'otp-token-123',
        email: 'tunde@gmail.com',
        maskedEmail: 't***@gmail.com',
      },
    });
  }),

  // Register verify
  http.post(`${API_URL}/auth/register/verify`, async ({ request }) => {
    const body = await request.json() as { otp: string };
    if (body.otp === '000000') {
      return HttpResponse.json(
        { success: false, message: 'Invalid OTP' },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { ...mockUser, isOnboarded: false },
      },
    });
  }),

  // Forgot password
  http.post(`${API_URL}/auth/forgot-password`, async () => {
    return HttpResponse.json({
      success: true,
      data: {
        otpToken: 'reset-token-123',
        maskedEmail: 't***@gmail.com',
      },
    });
  }),

  // Reset password
  http.post(`${API_URL}/auth/reset-password`, async () => {
    return HttpResponse.json({ success: true, data: null });
  }),

  // 2FA challenge
  http.post(`${API_URL}/auth/2fa/challenge`, async ({ request }) => {
    const body = await request.json() as { totpCode: string };
    if (body.totpCode === '000000') {
      return HttpResponse.json(
        { success: false, message: 'Invalid code' },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: mockUser,
      },
    });
  }),

  // Get me
  http.get(`${API_URL}/users/me`, () => {
    return HttpResponse.json({ success: true, data: mockUser });
  }),

  // Onboard
  http.post(`${API_URL}/users/me/onboard`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { ...mockUser, ...body, isOnboarded: true },
    });
  }),

  // Auth refresh
  http.post(`${API_URL}/auth/refresh`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
    });
  }),
];
