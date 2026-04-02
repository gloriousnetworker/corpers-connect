import api from './client';
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
export async function refreshTokens(refreshToken: string): Promise<RefreshResponse> {
  const { data } = await api.post<ApiResponse<RefreshResponse>>('/auth/refresh', {
    refreshToken,
  });
  return data.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

// ── Password ──────────────────────────────────────────────────────────────
export async function forgotPassword(email: string): Promise<{ otpToken: string; maskedEmail: string }> {
  const { data } = await api.post<ApiResponse<{ otpToken: string; maskedEmail: string }>>(
    '/auth/forgot-password',
    { email }
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
}): Promise<void> {
  await api.put('/auth/change-password', payload);
}

// ── 2FA ───────────────────────────────────────────────────────────────────
export async function initiate2FA(): Promise<Enable2FAResponse> {
  const { data } = await api.post<ApiResponse<Enable2FAResponse>>('/auth/2fa/enable');
  return data.data;
}

export async function confirm2FA(totpCode: string): Promise<void> {
  await api.post('/auth/2fa/verify-enable', { totpCode });
}

export async function disable2FA(totpCode: string): Promise<void> {
  await api.post('/auth/2fa/disable', { totpCode });
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
