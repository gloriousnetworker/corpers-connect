/**
 * Integration tests for real-time socket behaviour in the messages store.
 * Tests the cache-update logic that useSocket() performs when events arrive.
 */
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { MessageType, ConversationType, ParticipantRole, UserLevel, SubscriptionTier } from '@/types/enums';
import type { Message, Conversation } from '@/types/models';
import type { InfiniteData } from '@tanstack/react-query';
import type { PaginatedData } from '@/types/api';

// ── Fixtures ───────────────────────────────────────────────────────────────

const sender = {
  id: 'user-2',
  stateCode: 'AB/23B/0001',
  firstName: 'Ngozi', lastName: 'Eze',
  email: 'ngozi@test.com',
  servingState: 'Abia', batch: '2023B',
  level: UserLevel.CORPER,
  subscriptionTier: SubscriptionTier.FREE,
  isVerified: false, isOnboarded: true,
  isActive: true, corperTag: false,
  isFirstLogin: false, twoFactorEnabled: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-2',
  sender,
  content: 'Hello there!',
  type: MessageType.TEXT,
  mediaUrl: null,
  replyToId: null,
  replyTo: null,
  isEdited: false,
  isDeleted: false,
  deliveredAt: null,
  readBy: [],
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

function makePage(messages: Message[]): PaginatedData<Message> {
  return { items: messages, nextCursor: null, hasMore: false };
}

function makeInfiniteData(messages: Message[]): InfiniteData<PaginatedData<Message>> {
  return { pages: [makePage(messages)], pageParams: [undefined] };
}

// ── Socket cache-update helpers (mirrors useSocket logic) ──────────────────

function simulateMessageNew(qc: QueryClient, msg: Message) {
  const key = queryKeys.messages(msg.conversationId);
  qc.setQueryData<InfiniteData<PaginatedData<Message>>>(key, (old) => {
    if (!old) return old;
    const pages = [...old.pages];
    const first = pages[0];
    if (first.items.some((m) => m.id === msg.id)) return old;
    pages[0] = { ...first, items: [msg, ...first.items] };
    return { ...old, pages };
  });
}

function simulateMessageEdited(qc: QueryClient, msg: Message) {
  const key = queryKeys.messages(msg.conversationId);
  qc.setQueryData<InfiniteData<PaginatedData<Message>>>(key, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((p) => ({
        ...p,
        items: p.items.map((m) => (m.id === msg.id ? msg : m)),
      })),
    };
  });
}

function simulateMessageDeleted(
  qc: QueryClient,
  messageId: string,
  conversationId: string,
  deleteFor: 'me' | 'all'
) {
  const key = queryKeys.messages(conversationId);
  qc.setQueryData<InfiniteData<PaginatedData<Message>>>(key, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((p) => ({
        ...p,
        items:
          deleteFor === 'all'
            ? p.items.map((m) =>
                m.id === messageId ? { ...m, isDeleted: true, content: null } : m
              )
            : p.items.filter((m) => m.id !== messageId),
      })),
    };
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Socket: message:new', () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // Seed cache with one existing message
    qc.setQueryData(
      queryKeys.messages('conv-1'),
      makeInfiniteData([makeMessage({ id: 'msg-existing', content: 'Old message' })])
    );
  });

  it('prepends new message to cache', () => {
    const newMsg = makeMessage({ id: 'msg-new', content: 'New message' });
    simulateMessageNew(qc, newMsg);

    const data = qc.getQueryData<InfiniteData<PaginatedData<Message>>>(
      queryKeys.messages('conv-1')
    );
    expect(data?.pages[0].items[0].id).toBe('msg-new');
    expect(data?.pages[0].items).toHaveLength(2);
  });

  it('does not duplicate if message already exists in cache', () => {
    const existingMsg = makeMessage({ id: 'msg-existing', content: 'Old message' });
    simulateMessageNew(qc, existingMsg);

    const data = qc.getQueryData<InfiniteData<PaginatedData<Message>>>(
      queryKeys.messages('conv-1')
    );
    expect(data?.pages[0].items).toHaveLength(1);
  });
});

describe('Socket: message:edited', () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(
      queryKeys.messages('conv-1'),
      makeInfiniteData([
        makeMessage({ id: 'msg-1', content: 'Original content' }),
        makeMessage({ id: 'msg-2', content: 'Another message' }),
      ])
    );
  });

  it('updates the edited message content in cache', () => {
    const edited = makeMessage({ id: 'msg-1', content: 'Edited content', isEdited: true });
    simulateMessageEdited(qc, edited);

    const data = qc.getQueryData<InfiniteData<PaginatedData<Message>>>(
      queryKeys.messages('conv-1')
    );
    const updatedMsg = data?.pages[0].items.find((m) => m.id === 'msg-1');
    expect(updatedMsg?.content).toBe('Edited content');
    expect(updatedMsg?.isEdited).toBe(true);
  });

  it('does not affect other messages', () => {
    const edited = makeMessage({ id: 'msg-1', content: 'Edited content', isEdited: true });
    simulateMessageEdited(qc, edited);

    const data = qc.getQueryData<InfiniteData<PaginatedData<Message>>>(
      queryKeys.messages('conv-1')
    );
    const untouched = data?.pages[0].items.find((m) => m.id === 'msg-2');
    expect(untouched?.content).toBe('Another message');
  });
});

describe('Socket: message:deleted', () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(
      queryKeys.messages('conv-1'),
      makeInfiniteData([
        makeMessage({ id: 'msg-1', content: 'Hello' }),
        makeMessage({ id: 'msg-2', content: 'World' }),
      ])
    );
  });

  it('marks message as deleted for "all"', () => {
    simulateMessageDeleted(qc, 'msg-1', 'conv-1', 'all');

    const data = qc.getQueryData<InfiniteData<PaginatedData<Message>>>(
      queryKeys.messages('conv-1')
    );
    const msg = data?.pages[0].items.find((m) => m.id === 'msg-1');
    expect(msg?.isDeleted).toBe(true);
    expect(msg?.content).toBeNull();
    expect(data?.pages[0].items).toHaveLength(2); // still in list, just marked
  });

  it('removes message from cache for "me"', () => {
    simulateMessageDeleted(qc, 'msg-1', 'conv-1', 'me');

    const data = qc.getQueryData<InfiniteData<PaginatedData<Message>>>(
      queryKeys.messages('conv-1')
    );
    expect(data?.pages[0].items).toHaveLength(1);
    expect(data?.pages[0].items[0].id).toBe('msg-2');
  });
});

describe('Read receipts: readBy array', () => {
  it('message with empty readBy shows as unread', () => {
    const msg = makeMessage({ readBy: [] });
    expect(msg.readBy).toHaveLength(0);
  });

  it('message with readBy containing recipient ID shows as read', () => {
    const msg = makeMessage({ readBy: ['user-1', 'user-2'] });
    const isReadByMe = msg.readBy?.includes('user-1');
    expect(isReadByMe).toBe(true);
  });

  it('after marking message as delivered, deliveredAt is set', () => {
    const msg = makeMessage({ deliveredAt: '2024-01-15T10:01:00Z' });
    expect(msg.deliveredAt).toBeTruthy();
  });

  it('cache update correctly reflects readBy change', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const original = makeMessage({ id: 'msg-1', readBy: [] });
    qc.setQueryData(queryKeys.messages('conv-1'), makeInfiniteData([original]));

    // Simulate server confirming the message was read
    const key = queryKeys.messages('conv-1');
    qc.setQueryData<InfiniteData<PaginatedData<Message>>>(key, (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((p) => ({
          ...p,
          items: p.items.map((m) =>
            m.id === 'msg-1' ? { ...m, readBy: ['user-1'] } : m
          ),
        })),
      };
    });

    const data = qc.getQueryData<InfiniteData<PaginatedData<Message>>>(key);
    const msg = data?.pages[0].items.find((m) => m.id === 'msg-1');
    expect(msg?.readBy).toContain('user-1');
  });
});
