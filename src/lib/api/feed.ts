import api from './client';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type { Post } from '@/types/models';

export interface FeedParams {
  cursor?: string;
  limit?: number;
}

export async function getFeed(params: FeedParams = {}): Promise<PaginatedData<Post>> {
  const { data } = await api.get<ApiResponse<PaginatedData<Post>>>('/feed', {
    params: {
      cursor: params.cursor,
      limit: params.limit ?? 20,
    },
  });
  return data.data;
}
