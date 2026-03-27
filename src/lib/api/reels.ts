import api from './client';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type { Post } from '@/types/models';
import { normalizePost } from './feed';

/** GET /reels — returns a paginated feed of reel-type posts */
export async function getReels(params: { cursor?: string; limit?: number } = {}): Promise<PaginatedData<Post>> {
  const { data } = await api.get<ApiResponse<PaginatedData<Post>>>('/reels', {
    params: { cursor: params.cursor, limit: params.limit ?? 10 },
  });
  return { ...data.data, items: data.data.items.map(normalizePost) };
}
