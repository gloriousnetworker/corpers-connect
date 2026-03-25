import api from './client';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type { Post, Comment } from '@/types/models';
import type { ReactionType, PostVisibility, PostType } from '@/types/enums';

// ── Feed ──────────────────────────────────────────────────────────────────

export interface CreatePostPayload {
  content?: string;
  mediaUrls?: string[];
  visibility?: PostVisibility;
  postType?: PostType;
}

export interface UpdatePostPayload {
  content?: string;
  visibility?: PostVisibility;
}

// ── Posts ─────────────────────────────────────────────────────────────────

export async function getPost(postId: string): Promise<Post> {
  const { data } = await api.get<ApiResponse<Post>>(`/posts/${postId}`);
  return data.data;
}

export async function createPost(payload: CreatePostPayload): Promise<Post> {
  const { data } = await api.post<ApiResponse<Post>>('/posts', payload);
  return data.data;
}

export async function updatePost(postId: string, payload: UpdatePostPayload): Promise<Post> {
  const { data } = await api.patch<ApiResponse<Post>>(`/posts/${postId}`, payload);
  return data.data;
}

export async function deletePost(postId: string): Promise<void> {
  await api.delete(`/posts/${postId}`);
}

// ── Reactions ─────────────────────────────────────────────────────────────

export async function reactToPost(postId: string, type: ReactionType): Promise<void> {
  await api.post(`/posts/${postId}/react`, { type });
}

export async function removeReaction(postId: string): Promise<void> {
  await api.delete(`/posts/${postId}/react`);
}

export interface ReactionItem {
  id: string;
  userId: string;
  user: import('@/types/models').User;
  type: ReactionType;
  createdAt: string;
}

export async function getPostReactions(
  postId: string,
  params: { cursor?: string; limit?: number } = {}
): Promise<PaginatedData<ReactionItem>> {
  const { data } = await api.get<ApiResponse<PaginatedData<ReactionItem>>>(
    `/posts/${postId}/reactions`,
    { params: { cursor: params.cursor, limit: params.limit ?? 20 } }
  );
  return data.data;
}

// ── Comments ──────────────────────────────────────────────────────────────

export async function getComments(
  postId: string,
  params: { cursor?: string; limit?: number } = {}
): Promise<PaginatedData<Comment>> {
  const { data } = await api.get<ApiResponse<PaginatedData<Comment>>>(
    `/posts/${postId}/comments`,
    { params: { cursor: params.cursor, limit: params.limit ?? 20 } }
  );
  return data.data;
}

export async function addComment(
  postId: string,
  payload: { content: string; parentId?: string }
): Promise<Comment> {
  const { data } = await api.post<ApiResponse<Comment>>(
    `/posts/${postId}/comments`,
    payload
  );
  return data.data;
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await api.delete(`/posts/${postId}/comments/${commentId}`);
}

// ── Bookmarks ─────────────────────────────────────────────────────────────

export async function bookmarkPost(postId: string): Promise<void> {
  await api.post(`/posts/${postId}/bookmark`);
}

export async function unbookmarkPost(postId: string): Promise<void> {
  await api.delete(`/posts/${postId}/bookmark`);
}

export async function getBookmarks(
  params: { cursor?: string; limit?: number } = {}
): Promise<PaginatedData<Post>> {
  const { data } = await api.get<ApiResponse<PaginatedData<Post>>>(
    '/users/me/bookmarks',
    { params: { cursor: params.cursor, limit: params.limit ?? 20 } }
  );
  return data.data;
}

// ── User Posts ─────────────────────────────────────────────────────────────

export async function getUserPosts(
  userId: string,
  params: { cursor?: string; limit?: number } = {}
): Promise<PaginatedData<Post>> {
  const { data } = await api.get<ApiResponse<PaginatedData<Post>>>(
    `/users/${userId}/posts`,
    { params: { cursor: params.cursor, limit: params.limit ?? 20 } }
  );
  return data.data;
}

// ── Share ──────────────────────────────────────────────────────────────────

export async function sharePost(
  postId: string
): Promise<{ id: string; sharesCount: number }> {
  const { data } = await api.post<ApiResponse<{ id: string; sharesCount: number }>>(
    `/posts/${postId}/share`
  );
  return data.data;
}

// ── Report ────────────────────────────────────────────────────────────────

export async function reportPost(
  postId: string,
  payload: { reason: string; details?: string }
): Promise<void> {
  await api.post(`/posts/${postId}/report`, payload);
}

// ── Media Upload (via backend — avoids needing a Cloudinary unsigned preset) ──

export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('media', file);

  // Use the authenticated Axios instance so the auth cookie/token is forwarded
  const { data } = await api.post<ApiResponse<{ url: string; mediaType: string }>>(
    '/media/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return data.data.url;
}
