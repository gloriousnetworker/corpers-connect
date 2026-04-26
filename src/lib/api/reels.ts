import api from './client';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type { Post } from '@/types/models';
import { PostVisibility, PostType } from '@/types/enums';
import { normalizePost } from './feed';
import { createPost, uploadToCloudinary } from './posts';

/** GET /reels — returns a paginated feed of reel-type posts */
export async function getReels(params: { cursor?: string; limit?: number } = {}): Promise<PaginatedData<Post>> {
  const { data } = await api.get<ApiResponse<PaginatedData<Post>>>('/reels', {
    params: { cursor: params.cursor, limit: params.limit ?? 10 },
  });
  return { ...data.data, items: data.data.items.map(normalizePost) };
}

export interface CreateReelPayload {
  file: File;
  caption?: string;
  visibility?: PostVisibility;
}

/**
 * Upload a video file then create a REEL-type post pointing to the uploaded URL.
 * Mirrors the mobile `createReel` API surface.
 */
export async function createReel(payload: CreateReelPayload): Promise<Post> {
  const url = await uploadToCloudinary(payload.file);
  return createPost({
    content: payload.caption,
    mediaUrls: [url],
    visibility: payload.visibility ?? PostVisibility.PUBLIC,
    postType: PostType.REEL,
  });
}
