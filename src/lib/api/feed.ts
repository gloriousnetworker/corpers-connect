import api from './client';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type { Post } from '@/types/models';
import type { ReactionType } from '@/types/enums';

// Backend returns counts nested under _count and the user's reaction as a
// reactions array. Flatten them to match the frontend Post type.
interface RawPost extends Omit<Post, 'reactionsCount' | 'commentsCount' | 'myReaction'> {
  _count?: { reactions?: number; comments?: number };
  reactions?: Array<{ reactionType: ReactionType }>;
  reactionsCount?: number;
  commentsCount?: number;
  myReaction?: ReactionType | null;
}

export function normalizePost(raw: RawPost): Post {
  return {
    ...raw,
    reactionsCount: raw.reactionsCount ?? raw._count?.reactions ?? 0,
    commentsCount: raw.commentsCount ?? raw._count?.comments ?? 0,
    sharesCount: raw.sharesCount ?? 0,
    myReaction: raw.myReaction ?? raw.reactions?.[0]?.reactionType ?? null,
  } as Post;
}

export interface FeedParams {
  cursor?: string;
  limit?: number;
}

export async function getFeed(params: FeedParams = {}): Promise<PaginatedData<Post>> {
  const { data } = await api.get<ApiResponse<PaginatedData<RawPost>>>('/feed', {
    params: {
      cursor: params.cursor,
      limit: params.limit ?? 20,
    },
  });
  return {
    ...data.data,
    items: data.data.items.map(normalizePost),
  };
}
