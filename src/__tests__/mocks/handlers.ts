import { http, HttpResponse } from 'msw';

// Must match the base URL constructed by the API client:
// API_URL (from constants.ts) + '/api/v1'
// Default in tests = 'https://corpers-connect-server-production.up.railway.app/api/v1'
const BASE = (process.env.NEXT_PUBLIC_API_URL ||
  'https://corpers-connect-server-production.up.railway.app') + '/api/v1';

const API_URL = BASE;

const mockUser = {
  id: 'user-123',
  stateCode: 'LA/23A/1234',
  firstName: 'Tunde',
  lastName: 'Adeyemi',
  email: 't***@gmail.com',
  servingState: 'Lagos',
  batch: '2023A',
  level: 'CORPER',
  subscriptionTier: 'FREE',
  isVerified: true,
  isOnboarded: true,
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  corperTag: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockPost = {
  id: 'post-123',
  authorId: 'user-123',
  author: mockUser,
  content: 'Hello from Lagos! First day at PPA.',
  mediaUrls: [],
  visibility: 'PUBLIC',
  postType: 'REGULAR',
  isEdited: false,
  isFlagged: false,
  reactionsCount: 3,
  commentsCount: 1,
  sharesCount: 0,
  myReaction: null,
  isBookmarked: false,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const mockStory = {
  id: 'story-123',
  authorId: 'user-123',
  author: mockUser,
  mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  mediaType: 'image',
  caption: 'Life at the PPA!',
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  createdAt: '2024-01-15T08:00:00Z',
  viewed: false,
  _count: { views: 0 },
};

const mockStoryGroup = {
  author: mockUser,
  authorId: 'user-123',
  stories: [mockStory],
  hasUnviewed: true,
};

const mockComment = {
  id: 'comment-123',
  postId: 'post-123',
  authorId: 'user-123',
  author: mockUser,
  content: 'Great post!',
  isEdited: false,
  replies: [],
  repliesCount: 0,
  createdAt: '2024-01-15T11:00:00Z',
  updatedAt: '2024-01-15T11:00:00Z',
};

export const handlers = [
  // ── Auth ────────────────────────────────────────────────────────────────

  // Login — success
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { identifier: string; password: string };
    if (body.password === 'wrongpassword') {
      return HttpResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: mockUser,
      },
    });
  }),

  // Login — 2FA required
  http.post(`${API_URL}/auth/login/2fa`, async () => {
    return HttpResponse.json({
      success: true,
      data: {
        requiresTwoFactor: true,
        challengeToken: 'challenge-token-123',
        userId: 'user-123',
      },
    });
  }),

  // Register initiate
  http.post(`${API_URL}/auth/register/initiate`, async () => {
    return HttpResponse.json({
      success: true,
      data: {
        otpToken: 'otp-token-123',
        email: 'tunde@gmail.com',
        maskedEmail: 't***@gmail.com',
      },
    });
  }),

  // Register verify
  http.post(`${API_URL}/auth/register/verify`, async ({ request }) => {
    const body = await request.json() as { otp: string };
    if (body.otp === '000000') {
      return HttpResponse.json(
        { success: false, message: 'Invalid OTP' },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { ...mockUser, isOnboarded: false },
      },
    });
  }),

  // Forgot password
  http.post(`${API_URL}/auth/forgot-password`, async () => {
    return HttpResponse.json({
      success: true,
      data: {
        otpToken: 'reset-token-123',
        maskedEmail: 't***@gmail.com',
      },
    });
  }),

  // Reset password
  http.post(`${API_URL}/auth/reset-password`, async () => {
    return HttpResponse.json({ success: true, data: null });
  }),

  // 2FA challenge
  http.post(`${API_URL}/auth/2fa/challenge`, async ({ request }) => {
    const body = await request.json() as { totpCode: string };
    if (body.totpCode === '000000') {
      return HttpResponse.json(
        { success: false, message: 'Invalid code' },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: mockUser,
      },
    });
  }),

  // Get me
  http.get(`${API_URL}/users/me`, () => {
    return HttpResponse.json({ success: true, data: mockUser });
  }),

  // Onboard
  http.post(`${API_URL}/users/me/onboard`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { ...mockUser, ...body, isOnboarded: true },
    });
  }),

  // Auth refresh
  http.post(`${API_URL}/auth/refresh`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
    });
  }),

  // ── Feed ────────────────────────────────────────────────────────────────

  http.get(`${API_URL}/feed`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: [mockPost],
        nextCursor: null,
        hasMore: false,
      },
    });
  }),

  // ── Posts ────────────────────────────────────────────────────────────────

  http.post(`${API_URL}/posts`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    if (!body.content && (!body.mediaUrls || (body.mediaUrls as string[]).length === 0)) {
      return HttpResponse.json(
        { success: false, message: 'Post must have content or media' },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        ...mockPost,
        id: 'post-new',
        content: body.content as string ?? '',
        mediaUrls: (body.mediaUrls as string[]) ?? [],
        visibility: (body.visibility as string) ?? 'PUBLIC',
        reactionsCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.get(`${API_URL}/posts/:postId`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: { ...mockPost, id: params.postId },
    });
  }),

  http.patch(`${API_URL}/posts/:postId`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { ...mockPost, id: params.postId, ...body, isEdited: true },
    });
  }),

  http.delete(`${API_URL}/posts/:postId`, () => {
    return HttpResponse.json({ success: true, data: null });
  }),

  // ── Reactions ─────────────────────────────────────────────────────────────

  http.post(`${API_URL}/posts/:postId/react`, () => {
    return HttpResponse.json({ success: true, data: null });
  }),

  http.delete(`${API_URL}/posts/:postId/react`, () => {
    return HttpResponse.json({ success: true, data: null });
  }),

  http.get(`${API_URL}/posts/:postId/reactions`, () => {
    return HttpResponse.json({
      success: true,
      data: { items: [], nextCursor: null, hasMore: false },
    });
  }),

  // ── Comments ──────────────────────────────────────────────────────────────

  http.get(`${API_URL}/posts/:postId/comments`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: [mockComment],
        nextCursor: null,
        hasMore: false,
      },
    });
  }),

  http.post(`${API_URL}/posts/:postId/comments`, async ({ params, request }) => {
    const body = await request.json() as { content: string; parentId?: string };
    if (!body.content?.trim()) {
      return HttpResponse.json(
        { success: false, message: 'Comment cannot be empty' },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        ...mockComment,
        id: 'comment-new',
        postId: params.postId,
        content: body.content,
        parentId: body.parentId ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.delete(`${API_URL}/posts/:postId/comments/:commentId`, () => {
    return HttpResponse.json({ success: true, data: null });
  }),

  // ── Bookmarks ─────────────────────────────────────────────────────────────

  http.post(`${API_URL}/posts/:postId/bookmark`, () => {
    return HttpResponse.json({ success: true, data: null });
  }),

  http.delete(`${API_URL}/posts/:postId/bookmark`, () => {
    return HttpResponse.json({ success: true, data: null });
  }),

  http.get(`${API_URL}/users/me/bookmarks`, () => {
    return HttpResponse.json({
      success: true,
      data: { items: [], nextCursor: null, hasMore: false },
    });
  }),

  // ── Share ─────────────────────────────────────────────────────────────────

  http.post(`${API_URL}/posts/:postId/share`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: { id: params.postId as string, sharesCount: 1 },
    });
  }),

  // ── Report ────────────────────────────────────────────────────────────────

  http.post(`${API_URL}/posts/:postId/report`, () => {
    return HttpResponse.json({ success: true, data: null });
  }),

  // ── User posts ────────────────────────────────────────────────────────────

  http.get(`${API_URL}/users/:userId/posts`, () => {
    return HttpResponse.json({
      success: true,
      data: { items: [mockPost], nextCursor: null, hasMore: false },
    });
  }),

  // ── Stories ───────────────────────────────────────────────────────────────

  http.get(`${API_URL}/stories`, () => {
    return HttpResponse.json({
      success: true,
      data: [mockStoryGroup],
    });
  }),

  http.post(`${API_URL}/stories`, async () => {
    return HttpResponse.json(
      {
        success: true,
        data: {
          ...mockStory,
          id: 'story-new',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        },
      },
      { status: 201 }
    );
  }),

  http.post(`${API_URL}/stories/:storyId/view`, () => {
    return HttpResponse.json({ success: true, data: mockStory });
  }),

  http.delete(`${API_URL}/stories/:storyId`, () => {
    return HttpResponse.json({ success: true, data: null });
  }),

  http.get(`${API_URL}/stories/users/:userId/highlights`, () => {
    return HttpResponse.json({ success: true, data: [] });
  }),
];
