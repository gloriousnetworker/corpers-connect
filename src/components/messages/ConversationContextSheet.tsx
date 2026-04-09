'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Archive,
  ArchiveRestore,
  Pin,
  PinOff,
  BellOff,
  Bell,
  Trash2,
  LogOut,
  Lock,
  LockOpen,
  MailOpen,
  Star,
  StarOff,
  Eraser,
} from 'lucide-react';
import {
  updateConversationSettings,
  leaveConversation,
  clearConversationMessages,
} from '@/lib/api/conversations';
import { queryKeys } from '@/lib/query-keys';
import ClientPortal from '@/components/ui/ClientPortal';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { ConversationType } from '@/types/enums';
import type { Conversation } from '@/types/models';

// ── localStorage helpers for lock + favorites ─────────────────────────────────

function getLocked(): Set<string> {
  try {
    const raw = localStorage.getItem('cc_locked_convs');
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function setLocked(ids: Set<string>) {
  localStorage.setItem('cc_locked_convs', JSON.stringify([...ids]));
}

function getFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem('cc_fav_convs');
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function setFavorites(ids: Set<string>) {
  localStorage.setItem('cc_fav_convs', JSON.stringify([...ids]));
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ConversationContextSheetProps {
  open: boolean;
  conversation: Conversation;
  currentUserId: string;
  onClose: () => void;
}

export default function ConversationContextSheet({
  open,
  conversation,
  currentUserId,
  onClose,
}: ConversationContextSheetProps) {
  useBodyScrollLock(open);
  const queryClient = useQueryClient();

  const myParticipant = conversation.participants.find(
    (p) => p.userId === currentUserId,
  );
  const isArchived = myParticipant?.isArchived ?? false;
  const isPinned = myParticipant?.isPinned ?? false;
  const isMuted = myParticipant?.isMuted ?? false;
  const isGroup = conversation.type === ConversationType.GROUP;

  // localStorage-backed state
  const [isLocked, setIsLocked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLocked(getLocked().has(conversation.id));
      setIsFavorite(getFavorites().has(conversation.id));
    }
  }, [open, conversation.id]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
  };

  const settingsMutation = useMutation({
    mutationFn: (settings: Parameters<typeof updateConversationSettings>[1]) =>
      updateConversationSettings(conversation.id, settings),
    onSuccess: () => { invalidate(); onClose(); },
    onError: () => toast.error('Failed to update conversation'),
  });

  const clearMutation = useMutation({
    mutationFn: () => clearConversationMessages(conversation.id),
    onSuccess: () => {
      invalidate();
      toast.success('Chat cleared');
      onClose();
    },
    onError: () => toast.error('Failed to clear chat'),
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveConversation(conversation.id),
    onSuccess: () => {
      invalidate();
      toast.success('Left group');
      onClose();
    },
    onError: () => toast.error('Failed to leave group'),
  });

  const handleToggleLock = () => {
    const locked = getLocked();
    if (locked.has(conversation.id)) {
      locked.delete(conversation.id);
    } else {
      locked.add(conversation.id);
    }
    setLocked(locked);
    setIsLocked(locked.has(conversation.id));
    toast.success(locked.has(conversation.id) ? 'Conversation locked' : 'Conversation unlocked');
    onClose();
  };

  const handleToggleFavorite = () => {
    const favs = getFavorites();
    if (favs.has(conversation.id)) {
      favs.delete(conversation.id);
    } else {
      favs.add(conversation.id);
    }
    setFavorites(favs);
    setIsFavorite(favs.has(conversation.id));
    toast.success(favs.has(conversation.id) ? 'Added to favorites' : 'Removed from favorites');
    onClose();
  };

  const handleMarkUnread = () => {
    settingsMutation.mutate({ markAsUnread: true });
  };

  const handleClearChat = () => {
    if (!confirm('Clear all messages in this chat? This cannot be undone.')) return;
    clearMutation.mutate();
  };

  const handleDelete = () => {
    if (isGroup) {
      leaveMutation.mutate();
    } else {
      settingsMutation.mutate({ isArchived: true });
    }
  };

  if (!open) return null;

  const isPending =
    settingsMutation.isPending || leaveMutation.isPending || clearMutation.isPending;

  const otherParticipant = conversation.participants.find((p) => p.userId !== currentUserId);
  const displayName = isGroup
    ? (conversation.name ?? 'Group')
    : otherParticipant
      ? `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`
      : 'Conversation';

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[9999] bg-black/50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div
          className="w-full sm:max-w-sm bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Conversation name */}
          <p className="text-sm font-semibold text-foreground text-center pb-3 px-4 truncate">
            {displayName}
          </p>

          <div className="border-t border-border" />

          {/* Actions */}
          <div className="py-2">
            <button
              onClick={() => settingsMutation.mutate({ isArchived: !isArchived })}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-foreground hover:bg-surface-alt transition-colors disabled:opacity-50"
            >
              {isArchived
                ? <ArchiveRestore className="w-4 h-4 text-foreground-secondary" />
                : <Archive className="w-4 h-4 text-foreground-secondary" />}
              {isArchived ? 'Unarchive' : 'Archive'}
            </button>

            <button
              onClick={handleToggleLock}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-foreground hover:bg-surface-alt transition-colors disabled:opacity-50"
            >
              {isLocked
                ? <LockOpen className="w-4 h-4 text-foreground-secondary" />
                : <Lock className="w-4 h-4 text-foreground-secondary" />}
              {isLocked ? 'Unlock' : 'Lock'}
            </button>

            <button
              onClick={() => settingsMutation.mutate({ isPinned: !isPinned })}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-foreground hover:bg-surface-alt transition-colors disabled:opacity-50"
            >
              {isPinned
                ? <PinOff className="w-4 h-4 text-foreground-secondary" />
                : <Pin className="w-4 h-4 text-foreground-secondary" />}
              {isPinned ? 'Unpin' : 'Pin'}
            </button>

            <button
              onClick={handleMarkUnread}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-foreground hover:bg-surface-alt transition-colors disabled:opacity-50"
            >
              <MailOpen className="w-4 h-4 text-foreground-secondary" />
              Mark as unread
            </button>

            <button
              onClick={handleToggleFavorite}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-foreground hover:bg-surface-alt transition-colors disabled:opacity-50"
            >
              {isFavorite
                ? <StarOff className="w-4 h-4 text-foreground-secondary" />
                : <Star className="w-4 h-4 text-foreground-secondary" />}
              {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            </button>

            <button
              onClick={() => settingsMutation.mutate({ isMuted: !isMuted })}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-foreground hover:bg-surface-alt transition-colors disabled:opacity-50"
            >
              {isMuted
                ? <Bell className="w-4 h-4 text-foreground-secondary" />
                : <BellOff className="w-4 h-4 text-foreground-secondary" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </button>

            <div className="my-1 border-t border-border/60" />

            <button
              onClick={handleClearChat}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-foreground hover:bg-surface-alt transition-colors disabled:opacity-50"
            >
              <Eraser className="w-4 h-4 text-foreground-secondary" />
              Clear chat
            </button>

            <button
              onClick={handleDelete}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-danger hover:bg-danger/5 transition-colors disabled:opacity-50"
            >
              {isGroup
                ? <LogOut className="w-4 h-4" />
                : <Trash2 className="w-4 h-4" />}
              {isGroup ? 'Leave group' : 'Delete chat'}
            </button>
          </div>

          {/* Safe area spacer */}
          <div className="h-safe-area-inset-bottom" />
        </div>
      </div>
    </ClientPortal>
  );
}
