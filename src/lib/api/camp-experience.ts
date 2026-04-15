import api from './client';
import type { ApiResponse } from '@/types/api';
import type {
  CampDayEntry,
  CampExperienceResponse,
  CampMood,
  CampDayVisibility,
} from '@/types/models';

export interface UpsertCampDayPayload {
  dayNumber: number;
  title?: string;
  story?: string;
  mood?: CampMood;
  mediaUrls?: string[];
  taggedUserIds?: string[];
  isHighlight?: boolean;
  visibility?: CampDayVisibility;
  campName?: string;
  campState?: string;
  entryDate?: string;
}

/** POST /camp-experience/days — create or update one of the caller's 21 days */
export async function upsertCampDay(payload: UpsertCampDayPayload): Promise<CampDayEntry> {
  const { data } = await api.post<ApiResponse<CampDayEntry>>(
    '/camp-experience/days',
    payload,
  );
  return data.data;
}

/** GET /camp-experience/me — caller's own 21-slot grid */
export async function getMyCampExperience(): Promise<CampExperienceResponse> {
  const { data } = await api.get<ApiResponse<CampExperienceResponse>>('/camp-experience/me');
  return data.data;
}

/** GET /camp-experience/users/:userId — another user's 21-slot grid (visibility-filtered) */
export async function getUserCampExperience(userId: string): Promise<CampExperienceResponse> {
  const { data } = await api.get<ApiResponse<CampExperienceResponse>>(
    `/camp-experience/users/${userId}`,
  );
  return data.data;
}

/** GET /camp-experience/users/:userId/days/:dayNumber — single day */
export async function getCampDay(userId: string, dayNumber: number): Promise<CampDayEntry> {
  const { data } = await api.get<ApiResponse<CampDayEntry>>(
    `/camp-experience/users/${userId}/days/${dayNumber}`,
  );
  return data.data;
}

/** DELETE /camp-experience/days/:dayNumber — delete caller's entry for that day */
export async function deleteCampDay(dayNumber: number): Promise<void> {
  await api.delete(`/camp-experience/days/${dayNumber}`);
}
