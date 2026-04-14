import api from './client';
import type { ApiResponse } from '@/types/api';
import type { Story, StoryGroup } from '@/types/models';

// ── Raw shapes returned by the backend ────────────────────────────────────────

interface BackendStory {
  id: string;
  authorId: string;
  author: Story['author'];
  mediaUrl: string;
  mediaType: string;
  caption?: string | null;
  expiresAt: string;
  createdAt: string;
  viewed: boolean;          // backend uses `viewed`, not `isViewed`
  hasReacted?: boolean;
  _count?: { views: number; reactions: number };
}

interface BackendStoryGroup {
  author: StoryGroup['author'];
  authorId: string;
  stories: BackendStory[];
  hasUnviewed: boolean;
}

// ── Normalise ─────────────────────────────────────────────────────────────────

function normalizeStory(s: BackendStory): Story {
  return {
    id: s.id,
    authorId: s.authorId,
    author: s.author,
    mediaUrl: s.mediaUrl,
    mediaType: s.mediaType,
    caption: s.caption,
    expiresAt: s.expiresAt,
    createdAt: s.createdAt,
    isViewed: s.viewed,
    viewCount: s._count?.views ?? 0,
    reactionsCount: s._count?.reactions ?? 0,
    hasReacted: s.hasReacted ?? false,
  };
}

function normalizeGroup(g: BackendStoryGroup): StoryGroup {
  return {
    author: g.author,
    stories: g.stories.map(normalizeStory),
    hasUnviewed: g.hasUnviewed,
  };
}

// ── API functions ─────────────────────────────────────────────────────────────

/** GET /stories — returns stories from followed users + own, grouped by author */
export async function getStories(): Promise<StoryGroup[]> {
  const { data } = await api.get<ApiResponse<BackendStoryGroup[]>>('/stories');
  return (data.data ?? []).map(normalizeGroup);
}

/**
 * POST /stories — upload a new story (image or video).
 * Sends multipart/form-data directly to backend; backend handles Cloudinary upload.
 */
export async function createStory(file: File, caption?: string): Promise<Story> {
  const formData = new FormData();
  formData.append('media', file);
  if (caption?.trim()) formData.append('caption', caption.trim());

  const { data } = await api.post<ApiResponse<BackendStory>>('/stories', formData);
  return normalizeStory(data.data);
}

/** POST /stories/:storyId/view — mark a story as viewed */
export async function viewStory(storyId: string): Promise<void> {
  await api.post(`/stories/${storyId}/view`);
}

/** DELETE /stories/:storyId — delete own story */
export async function deleteStory(storyId: string): Promise<void> {
  await api.delete(`/stories/${storyId}`);
}

/** GET /stories/users/:userId/highlights */
export async function getUserHighlights(userId: string): Promise<Story[]> {
  const { data } = await api.get<ApiResponse<{ story: BackendStory }[]>>(
    `/stories/users/${userId}/highlights`,
  );
  return (data.data ?? []).map((h) => normalizeStory(h.story));
}

/** POST /stories/:storyId/react — toggle ❤️ reaction */
export async function reactToStory(storyId: string): Promise<{ reacted: boolean }> {
  const { data } = await api.post<ApiResponse<{ reacted: boolean }>>(`/stories/${storyId}/react`);
  return data.data;
}

/** POST /stories/:storyId/reply — send reply as DM */
export async function replyToStory(storyId: string, content: string): Promise<{ conversationId: string }> {
  const { data } = await api.post<ApiResponse<{ conversationId: string }>>(`/stories/${storyId}/reply`, { content });
  return data.data;
}
