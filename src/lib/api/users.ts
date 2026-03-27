import api from './client';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type { User } from '@/types/models';

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
