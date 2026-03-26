'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getConversations, sendMessage } from '@/lib/api/conversations';
import { queryKeys } from '@/lib/query-keys';
import { getInitials } from '@/lib/utils';
import { ConversationType } from '@/types/enums';
import type { Message, Conversation } from '@/types/models';

interface ForwardModalProps {
  message: Message;
  currentUserId: string;
  onClose: () => void;
}

function getConversationName(conv: Conversation, currentUserId: string): string {
  if (conv.type === ConversationType.GROUP) {
    return conv.name ?? 'Group';
  }
  const other = conv.participants.find((p) => p.userId !== currentUserId);
  if (!other) return 'Unknown';
  return `${other.user.firstName} ${other.user.lastName}`;
}

function getConversationSubtitle(conv: Conversation): string {
  if (conv.type === ConversationType.GROUP) {
    return `${conv.participants.length} members`;
  }
  return 'Direct message';
}

function getConversationAvatar(conv: Conversation, currentUserId: string): string | null {
  if (conv.type === ConversationType.GROUP) {
    return conv.picture ?? null;
  }
  const other = conv.participants.find((p) => p.userId !== currentUserId);
  return other?.user.profilePicture ?? null;
}

function getConversationInitials(conv: Conversation, currentUserId: string): string {
  if (conv.type === ConversationType.GROUP) {
    return (conv.name ?? 'G').slice(0, 2).toUpperCase();
  }
  const other = conv.participants.find((p) => p.userId !== currentUserId);
  if (!other) return '?';
  return getInitials(other.user.firstName, other.user.lastName);
}

export default function ForwardModal({ message, currentUserId, onClose }: ForwardModalProps) {
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: queryKeys.conversations(),
    queryFn: getConversations,
    staleTime: 60_000,
  });

  const filtered = conversations
    .filter((conv) => conv.id !== message.conversationId)
    .filter((conv) => {
      if (!search.trim()) return true;
      const name = getConversationName(conv, currentUserId).toLowerCase();
      return name.includes(search.trim().toLowerCase());
    });

  const handleForward = async (conv: Conversation) => {
    if (sending) return;
    setSending(true);
    try {
      await sendMessage(conv.id, {
        content: message.content ?? undefined,
        type: message.type,
        mediaUrl: message.mediaUrl ?? undefined,
      });
      toast.success('Message forwarded');
      onClose();
    } catch {
      toast.error('Failed to forward message');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="fixed inset-x-4 top-[15%] z-50 bg-surface rounded-2xl shadow-sheet flex flex-col max-h-[70dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <span className="font-semibold text-foreground">Forward to...</span>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-alt transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 bg-surface-alt rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-foreground-muted flex-shrink-0" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-muted outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-foreground-muted">No conversations found</p>
            </div>
          ) : (
            filtered.map((conv) => {
              const name = getConversationName(conv, currentUserId);
              const subtitle = getConversationSubtitle(conv);
              const avatar = getConversationAvatar(conv, currentUserId);
              const initials = getConversationInitials(conv, currentUserId);

              return (
                <button
                  key={conv.id}
                  onClick={() => handleForward(conv)}
                  disabled={sending}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-alt active:bg-surface-alt transition-colors disabled:opacity-50"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {avatar ? (
                      <div className="relative w-10 h-10">
                        <Image
                          src={avatar}
                          alt={name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-primary uppercase">{initials}</span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-foreground truncate">{name}</p>
                    <p className="text-xs text-foreground-muted truncate">{subtitle}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
