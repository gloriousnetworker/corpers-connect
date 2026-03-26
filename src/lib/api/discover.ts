import api from './client';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type { User } from '@/types/models';

export interface DiscoverUser extends Pick<User,
  'id' | 'firstName' | 'lastName' | 'profilePicture' | 'bio' |
  'level' | 'isVerified' | 'subscriptionTier' | 'servingState' |
  'lga' | 'ppa' | 'batch' | 'corperTag' | 'corperTagLabel' | 'createdAt'
> {
  isFollowing?: boolean;
}

/** GET /discover/corpers — corpers in same serving state */
export async function getCorpersInState(
  cursor?: string,
  limit = 20
): Promise<PaginatedData<DiscoverUser> & { state?: string }> {
  const { data } = await api.get<ApiResponse<PaginatedData<DiscoverUser> & { state?: string }>>(
    '/discover/corpers',
    { params: { cursor, limit } }
  );
  return data.data;
}

/** GET /discover/suggestions — follow suggestions (same state first) */
export async function getSuggestions(limit = 20): Promise<DiscoverUser[]> {
  const { data } = await api.get<ApiResponse<DiscoverUser[]>>(
    '/discover/suggestions',
    { params: { limit } }
  );
  return data.data ?? [];
}

/** GET /discover/search — search users by name or state code */
export async function searchDiscover(
  q: string,
  cursor?: string,
  limit = 20
): Promise<PaginatedData<DiscoverUser>> {
  const { data } = await api.get<ApiResponse<PaginatedData<DiscoverUser>>>(
    '/discover/search',
    { params: { q, cursor, limit } }
  );
  return { items: data.data?.items ?? [], nextCursor: data.data?.nextCursor ?? null, hasMore: data.data?.hasMore ?? false };
}
