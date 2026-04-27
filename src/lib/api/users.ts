import axios from 'axios';
import api, { getAccessToken } from './client';
import { WS_URL } from '@/lib/constants';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type { User } from '@/types/models';
import type { CorperUpgradeStatus, AccountType, MarketerStatus } from '@/types/enums';

export async function getMe(): Promise<User> {
  const { data } = await api.get<ApiResponse<User>>('/users/me');
  return data.data;
}

export async function updateMe(payload: {
  bio?: string;
  corperTag?: boolean;
  corperTagLabel?: string | null;
}): Promise<User> {
  const { data } = await api.patch<ApiResponse<User>>('/users/me', payload);
  return data.data;
}

export async function onboardMe(payload: {
  bio?: string;
  corperTag?: boolean;
  corperTagLabel?: string;
}): Promise<User> {
  const { data } = await api.post<ApiResponse<User>>('/users/me/onboard', payload);
  return data.data;
}

export async function uploadAvatar(file: File): Promise<User> {
  const formData = new FormData();
  formData.append('avatar', file);
  const { data } = await api.post<ApiResponse<User>>('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function uploadBanner(file: File): Promise<User> {
  const formData = new FormData();
  formData.append('banner', file);
  const { data } = await api.post<ApiResponse<User>>('/users/me/banner', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function getUserProfile(userId: string): Promise<User> {
  const { data } = await api.get<ApiResponse<User>>(`/users/${userId}`);
  return data.data;
}

export async function followUser(userId: string): Promise<void> {
  await api.post(`/users/${userId}/follow`);
}

export async function unfollowUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}/follow`);
}

export async function blockUser(userId: string): Promise<void> {
  await api.post(`/users/${userId}/block`);
}

export async function unblockUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}/block`);
}

export async function isFollowing(userId: string): Promise<boolean> {
  const { data } = await api.get<ApiResponse<{ isFollowing: boolean }>>(
    `/users/${userId}/is-following`
  );
  return data.data.isFollowing;
}

export async function getFollowers(
  userId: string,
  cursor?: string,
  limit = 20
): Promise<PaginatedData<User>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  const { data } = await api.get<ApiResponse<PaginatedData<User>>>(
    `/users/${userId}/followers?${params}`
  );
  return data.data;
}

export async function getFollowing(
  userId: string,
  cursor?: string,
  limit = 20
): Promise<PaginatedData<User>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  const { data } = await api.get<ApiResponse<PaginatedData<User>>>(
    `/users/${userId}/following?${params}`
  );
  return data.data;
}

export async function getBlockedUsers(): Promise<User[]> {
  const { data } = await api.get<ApiResponse<User[]>>('/users/me/blocked');
  return data.data;
}

export async function registerFcmToken(fcmToken: string, platform: string): Promise<void> {
  await api.post('/users/me/fcm-token', { fcmToken, platform });
}

export async function removeFcmToken(fcmToken: string): Promise<void> {
  await api.delete('/users/me/fcm-token', { data: { fcmToken } });
}

export async function deleteAccount(): Promise<void> {
  await api.delete('/users/me');
}

export async function initiateEmailChange(newEmail: string, currentPassword: string): Promise<{ maskedEmail: string }> {
  const { data } = await api.post<ApiResponse<{ maskedEmail: string }>>('/users/me/email/initiate', { newEmail, currentPassword });
  return data.data;
}

export async function verifyEmailChange(otp: string): Promise<User> {
  const { data } = await api.post<ApiResponse<User>>('/users/me/email/verify', { otp });
  return data.data;
}

// ── Corper upgrade (marketer → corper) ──────────────────────────────────────

export interface CorperUpgradeStatusInfo {
  accountType: AccountType;
  marketerStatus: MarketerStatus | null;
  corperUpgradeStatus: CorperUpgradeStatus | null;
  corperUpgradeDocumentUrl: string | null;
  corperUpgradeRequestedStateCode: string | null;
  corperUpgradeRequestedAt: string | null;
  corperUpgradeReviewedAt: string | null;
  corperUpgradeRejectionReason: string | null;
}

export async function getMyCorperUpgrade(): Promise<CorperUpgradeStatusInfo> {
  const { data } = await api.get<ApiResponse<CorperUpgradeStatusInfo>>('/users/me/corper-upgrade');
  return data.data;
}

/**
 * Submit a Corper upgrade request. Multipart upload of the NYSC posting
 * letter / ID card. Goes direct to Railway to bypass the Next.js proxy's
 * ~4.5 MB body cap (same fix as media uploads).
 */
export async function requestCorperUpgrade(payload: {
  stateCode: string;
  document: File;
}): Promise<{ corperUpgradeStatus: CorperUpgradeStatus; corperUpgradeDocumentUrl: string }> {
  const form = new FormData();
  form.append('stateCode', payload.stateCode);
  form.append('media', payload.document);

  const token = getAccessToken();
  const { data } = await axios.post<ApiResponse<{
    corperUpgradeStatus: CorperUpgradeStatus;
    corperUpgradeDocumentUrl: string;
  }>>(
    `${WS_URL}/api/v1/users/me/corper-upgrade`,
    form,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      timeout: 0,
      withCredentials: false,
    },
  );
  return data.data;
}
