import axios from 'axios';
import api from './client';
import { WS_URL } from '@/lib/constants';
import type { ApiResponse } from '@/types/api';
import type {
  LoginResponse,
  LoginWith2FAResponse,
  RegisterInitiateResponse,
  NyscLookupResponse,
  RefreshResponse,
  Enable2FAResponse,
} from '@/types/api';
import type { User, Session } from '@/types/models';

// ── Lookup ─────────────────────────────────────────────────────────────────
export async function lookupStateCode(stateCode: string): Promise<NyscLookupResponse> {
  const { data } = await api.post<ApiResponse<NyscLookupResponse>>('/auth/lookup', { stateCode });
  return data.data;
}

// ── Register ───────────────────────────────────────────────────────────────
export async function registerInitiate(payload: {
  stateCode: string;
  password: string;
  confirmPassword: string;
}): Promise<RegisterInitiateResponse> {
  const { data } = await api.post<ApiResponse<RegisterInitiateResponse>>(
    '/auth/register/initiate',
    payload
  );
  return data.data;
}

export async function registerVerify(payload: {
  stateCode: string;
  otp: string;
}): Promise<LoginResponse> {
  const { data } = await api.post<ApiResponse<LoginResponse>>(
    '/auth/register/verify',
    payload
  );
  return data.data;
}

// ── Marketer (NIN-verified non-corper) registration ─────────────────────────

export interface MarketerRegisterInitiateResponse {
  email: string;
  maskedEmail: string;
  message: string;
}

/**
 * Step 1 of marketer registration. The NIN photo + identity fields go up as
 * multipart/form-data — and this endpoint bypasses /api/proxy because Vercel
 * caps that route's body at ~4.5 MB. Going direct to Railway avoids that.
 */
export async function registerMarketerInitiate(payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nin: string;
  password: string;
  confirmPassword: string;
  ninDocument: File;
}): Promise<MarketerRegisterInitiateResponse> {
  const form = new FormData();
  form.append('firstName', payload.firstName);
  form.append('lastName', payload.lastName);
  form.append('email', payload.email);
  form.append('phone', payload.phone);
  form.append('nin', payload.nin);
  form.append('password', payload.password);
  form.append('confirmPassword', payload.confirmPassword);
  form.append('media', payload.ninDocument);

  const { data } = await axios.post<ApiResponse<MarketerRegisterInitiateResponse>>(
    `${WS_URL}/api/v1/auth/register/marketer/initiate`,
    form,
    {
      // No auth header (this is a public endpoint), no cookies, no timeout —
      // marketer NIN photos can be a few MB on slow networks.
      timeout: 0,
      withCredentials: false,
    },
  );
  return data.data;
}

export async function registerMarketerVerify(payload: {
  email: string;
  otp: string;
}): Promise<LoginResponse> {
  // Goes through the proxy like the corper verify — body is small (just OTP).
  const { data } = await api.post<ApiResponse<LoginResponse>>(
    '/auth/register/marketer/verify',
    payload,
  );
  return data.data;
}

// ── Login ──────────────────────────────────────────────────────────────────
export async function login(payload: {
  identifier: string;
  password: string;
}): Promise<LoginResponse | LoginWith2FAResponse> {
  const { data } = await api.post<ApiResponse<LoginResponse | LoginWith2FAResponse>>(
    '/auth/login',
    payload
  );
  return data.data;
}

export async function twoFAChallenge(payload: {
  challengeToken: string;
  totpCode: string;
}): Promise<LoginResponse> {
  const { data } = await api.post<ApiResponse<LoginResponse>>(
    '/auth/2fa/challenge',
    payload
  );
  return data.data;
}

// ── Token management ───────────────────────────────────────────────────────
// No body needed — the refresh token is sent automatically via httpOnly cookie.
export async function refreshTokens(): Promise<RefreshResponse> {
  const { data } = await api.post<ApiResponse<RefreshResponse>>('/auth/refresh');
  return data.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

// ── Password ──────────────────────────────────────────────────────────────
export async function forgotPassword(identifier: string): Promise<{ otpToken: string; maskedEmail: string }> {
  const { data } = await api.post<ApiResponse<{ otpToken: string; maskedEmail: string }>>(
    '/auth/forgot-password',
    { identifier }
  );
  return data.data;
}

export async function resetPassword(payload: {
  otpToken: string;
  otp: string;
  newPassword: string;
}): Promise<void> {
  await api.post('/auth/reset-password', payload);
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<void> {
  await api.put('/auth/change-password', payload);
}

// ── 2FA ───────────────────────────────────────────────────────────────────
export async function initiate2FA(): Promise<Enable2FAResponse> {
  const { data } = await api.post<ApiResponse<Enable2FAResponse>>('/auth/2fa/enable');
  return data.data;
}

export async function confirm2FA(code: string): Promise<void> {
  await api.post('/auth/2fa/verify-enable', { code });
}

export async function disable2FA(code: string): Promise<void> {
  await api.post('/auth/2fa/disable', { code });
}

// ── Sessions ──────────────────────────────────────────────────────────────
export async function getSessions(): Promise<Session[]> {
  const { data } = await api.get<ApiResponse<Session[]>>('/auth/sessions');
  return data.data;
}

export async function revokeSession(sessionId: string): Promise<void> {
  await api.delete(`/auth/sessions/${sessionId}`);
}

export async function revokeAllSessions(): Promise<void> {
  await api.delete('/auth/sessions');
}
