import api from './client';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type { Conversation, ConversationParticipant, Message } from '@/types/models';
import { ConversationType, MessageType, ParticipantRole } from '@/types/enums';

// ── Raw backend shapes ────────────────────────────────────────────────────────

interface RawUser {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string | null;
  isVerified: boolean;
}

interface RawMessageRead {
  userId: string;
  readAt: string;
}

interface RawReaction {
  id: string;
  messageId: string;
  userId: string;
  user: RawUser;
  emoji: string;
  createdAt: string;
}

interface RawMessage {
  id: string;
  conversationId: string;
  senderId: string;
  sender: RawUser;
  content?: string | null;
  type: string;
  mediaUrl?: string | null;
  replyToId?: string | null;
  replyTo?: Omit<RawMessage, 'replyTo'> | null;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned?: boolean;
  reactions?: RawReaction[];
  deliveredAt?: string | null;
  reads?: RawMessageRead[];
  createdAt: string;
  updatedAt: string;
}

interface RawParticipant {
  conversationId: string;
  userId: string;
  user: RawUser;
  role: string;
  joinedAt: string;
  isArchived: boolean;
  isPinned: boolean;
  isMuted: boolean;
  mutedUntil?: string | null;
  lastReadAt?: string | null;
}

interface RawConversation {
  id: string;
  type: string;
  name?: string | null;
  picture?: string | null;
  description?: string | null;
  inviteToken?: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  participants: RawParticipant[];
  messages: RawMessage[];
}

interface RawParticipantEntry {
  conversationId: string;
  userId: string;
  role: string;
  joinedAt: string;
  isArchived: boolean;
  isPinned: boolean;
  isMuted: boolean;
  mutedUntil?: string | null;
  lastReadAt?: string | null;
  conversation: RawConversation;
}

// ── Normalise helpers ─────────────────────────────────────────────────────────

export function normalizeMessage(m: RawMessage): Message {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    sender: m.sender as Message['sender'],
    content: m.content,
    type: (m.type as MessageType) ?? MessageType.TEXT,
    mediaUrl: m.mediaUrl,
    replyToId: m.replyToId,
    replyTo: m.replyTo ? normalizeMessage(m.replyTo as RawMessage) : null,
    isEdited: m.isEdited,
    isDeleted: m.isDeleted,
    isPinned: m.isPinned ?? false,
    reactions: (m.reactions ?? []).map((r) => ({
      id: r.id,
      messageId: r.messageId,
      userId: r.userId,
      user: r.user,
      emoji: r.emoji,
      createdAt: r.createdAt,
    })),
    deliveredAt: m.deliveredAt,
    readBy: (m.reads ?? []).map((r) => r.userId),
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

function normalizeParticipant(p: RawParticipant): ConversationParticipant {
  return {
    conversationId: p.conversationId,
    userId: p.userId,
    user: p.user as ConversationParticipant['user'],
    role: (p.role as ParticipantRole) ?? ParticipantRole.MEMBER,
    joinedAt: p.joinedAt,
    isArchived: p.isArchived,
    isPinned: p.isPinned,
    isMuted: p.isMuted,
    lastReadAt: p.lastReadAt,
  };
}

function normalizeConvFromEntry(entry: RawParticipantEntry): Conversation {
  const c = entry?.conversation;
  if (!c) {
    // Defensive: entry didn't include nested conversation — return minimal shape
    return {
      id: entry.conversationId,
      type: ConversationType.DM,
      name: null,
      picture: null,
      description: null,
      participants: [],
      lastMessage: null,
      unreadCount: 0,
      createdAt: entry.joinedAt,
      updatedAt: entry.joinedAt,
    };
  }
  const participants = c.participants ?? [];
  const messages = c.messages ?? [];
  return {
    id: c.id,
    type: (c.type as ConversationType) ?? ConversationType.DM,
    name: c.name,
    picture: c.picture,
    description: c.description,
    participants: participants.map(normalizeParticipant),
    lastMessage: messages.length > 0 ? normalizeMessage(messages[0]) : null,
    unreadCount: c.unreadCount ?? 0,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function normalizeConvDirect(c: RawConversation): Conversation {
  const participants = c.participants ?? [];
  const messages = c.messages ?? [];
  return {
    id: c.id,
    type: (c.type as ConversationType) ?? ConversationType.DM,
    name: c.name,
    picture: c.picture,
    description: c.description,
    participants: participants.map(normalizeParticipant),
    lastMessage: messages.length > 0 ? normalizeMessage(messages[0]) : null,
    unreadCount: c.unreadCount ?? 0,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

// ── API functions ─────────────────────────────────────────────────────────────

/** GET /conversations — list all conversations, sorted by latest activity */
export async function getConversations(): Promise<Conversation[]> {
  const { data } = await api.get<ApiResponse<RawParticipantEntry[]>>('/conversations');
  return (data.data ?? []).map(normalizeConvFromEntry);
}

/** GET /conversations/:id */
export async function getConversation(conversationId: string): Promise<Conversation> {
  const { data } = await api.get<ApiResponse<RawParticipantEntry>>(`/conversations/${conversationId}`);
  return normalizeConvFromEntry(data.data);
}

/** POST /conversations — create DM or GROUP */
export async function createConversation(
  payload:
    | { type: 'DM'; participantId: string }
    | { type: 'GROUP'; name: string; description?: string; participantIds: string[] }
): Promise<Conversation> {
  const { data } = await api.post<ApiResponse<RawConversation>>('/conversations', payload);
  return normalizeConvDirect(data.data);
}

/** GET /conversations/:id/messages — cursor-paginated, newest first */
export async function getMessages(
  conversationId: string,
  params: { cursor?: string; limit?: number } = {}
): Promise<PaginatedData<Message>> {
  const { data } = await api.get<ApiResponse<PaginatedData<RawMessage>>>(
    `/conversations/${conversationId}/messages`,
    { params: { cursor: params.cursor, limit: params.limit ?? 30 } }
  );
  return {
    items: (data.data.items ?? []).map(normalizeMessage),
    nextCursor: data.data.nextCursor,
    hasMore: data.data.hasMore,
  };
}

/** GET /conversations/:id/messages/search */
export async function searchMessages(
  conversationId: string,
  q: string,
  params: { cursor?: string; limit?: number } = {}
): Promise<PaginatedData<Message>> {
  const { data } = await api.get<ApiResponse<PaginatedData<RawMessage>>>(
    `/conversations/${conversationId}/messages/search`,
    { params: { q, cursor: params.cursor, limit: params.limit ?? 20 } }
  );
  return {
    items: (data.data.items ?? []).map(normalizeMessage),
    nextCursor: data.data.nextCursor,
    hasMore: data.data.hasMore,
  };
}

/** POST /conversations/:id/messages */
export async function sendMessage(
  conversationId: string,
  payload: {
    content?: string;
    type?: string;
    mediaUrl?: string;
    replyToId?: string;
  }
): Promise<Message> {
  const { data } = await api.post<ApiResponse<RawMessage>>(
    `/conversations/${conversationId}/messages`,
    payload
  );
  return normalizeMessage(data.data);
}

/** PATCH /conversations/:id/messages/:msgId — edit message */
export async function editMessage(
  conversationId: string,
  messageId: string,
  content: string
): Promise<Message> {
  const { data } = await api.patch<ApiResponse<RawMessage>>(
    `/conversations/${conversationId}/messages/${messageId}`,
    { content }
  );
  return normalizeMessage(data.data);
}

/** DELETE /conversations/:id/messages/:msgId */
export async function deleteMessage(
  conversationId: string,
  messageId: string,
  forAll = false
): Promise<void> {
  await api.delete(
    `/conversations/${conversationId}/messages/${messageId}`,
    { params: { for: forAll ? 'all' : 'me' } }
  );
}

/** POST /conversations/:id/read — mark messages as read */
export async function markRead(conversationId: string, messageIds: string[]): Promise<void> {
  await api.post(`/conversations/${conversationId}/read`, { messageIds });
}

/** PATCH /conversations/:id/settings — archive, pin, mute, mark as unread */
export async function updateConversationSettings(
  conversationId: string,
  settings: {
    isArchived?: boolean;
    isPinned?: boolean;
    isMuted?: boolean;
    mutedUntil?: string;
    markAsUnread?: boolean;
  }
): Promise<void> {
  await api.patch(`/conversations/${conversationId}/settings`, settings);
}

/** DELETE /conversations/:id/messages — clear all messages for current user */
export async function clearConversationMessages(conversationId: string): Promise<void> {
  await api.delete(`/conversations/${conversationId}/messages`);
}

/** DELETE /conversations/:id/participants/me — leave group */
export async function leaveConversation(conversationId: string): Promise<void> {
  await api.delete(`/conversations/${conversationId}/participants/me`);
}

/** POST /media/upload — upload an image/audio/video file, returns Cloudinary URL */
export async function uploadMessageMedia(
  file: File
): Promise<{ url: string; mediaType: string }> {
  const form = new FormData();
  form.append('media', file); // must match multer .single('media') on the backend
  const { data } = await api.post<ApiResponse<{ url: string; mediaType: string }>>(
    '/media/upload',
    form
  );
  return data.data;
}

/** POST /conversations/:id/participants — add participants (admin only) */
export async function addParticipants(
  conversationId: string,
  userIds: string[]
): Promise<void> {
  await api.post(`/conversations/${conversationId}/participants`, { userIds });
}

/** DELETE /conversations/:id/participants/:userId — remove participant (admin only) */
export async function removeParticipant(
  conversationId: string,
  userId: string
): Promise<void> {
  await api.delete(`/conversations/${conversationId}/participants/${userId}`);
}

/** PATCH /conversations/:id — update group name/description/picture (admin only) */
export async function updateGroup(
  conversationId: string,
  payload: { name?: string; description?: string; picture?: string }
): Promise<Conversation> {
  const { data } = await api.patch<ApiResponse<RawConversation>>(
    `/conversations/${conversationId}`,
    payload
  );
  return normalizeConvDirect(data.data);
}

/** POST /conversations/:id/messages/:msgId/reactions — add emoji reaction */
export async function reactToMessage(
  conversationId: string,
  messageId: string,
  emoji: string
): Promise<Message> {
  const { data } = await api.post<ApiResponse<RawMessage>>(
    `/conversations/${conversationId}/messages/${messageId}/reactions`,
    { emoji }
  );
  return normalizeMessage(data.data);
}

/** DELETE /conversations/:id/messages/:msgId/reactions — remove emoji reaction */
export async function removeMessageReaction(
  conversationId: string,
  messageId: string,
  emoji: string
): Promise<Message> {
  const { data } = await api.delete<ApiResponse<RawMessage>>(
    `/conversations/${conversationId}/messages/${messageId}/reactions`,
    { data: { emoji } }
  );
  return normalizeMessage(data.data);
}

/** PATCH /conversations/:id/messages/:msgId/pin — pin or unpin a message */
export async function pinMessage(
  conversationId: string,
  messageId: string,
  isPinned: boolean
): Promise<Message> {
  const { data } = await api.patch<ApiResponse<RawMessage>>(
    `/conversations/${conversationId}/messages/${messageId}/pin`,
    { isPinned }
  );
  return normalizeMessage(data.data);
}

/** GET /discover/search — search users to start a DM */
export async function searchUsers(
  query: string
): Promise<{ id: string; firstName: string; lastName: string; profilePicture?: string | null; isVerified: boolean; servingState: string; isFollowing?: boolean; followsYou?: boolean }[]> {
  const { data } = await api.get<ApiResponse<{ items: { id: string; firstName: string; lastName: string; profilePicture?: string | null; isVerified: boolean; servingState: string; isFollowing?: boolean; followsYou?: boolean }[] }>>(
    '/discover/search',
    { params: { q: query, limit: 20 } }
  );
  return data.data?.items ?? [];
}
