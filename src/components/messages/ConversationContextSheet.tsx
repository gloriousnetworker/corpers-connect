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
import PinEntryModal, { getChatPin } from './PinEntryModal';

// ── localStorage helpers ──────────────────────────────────────────────────────

function getSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}

function saveSet(key: string, ids: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify([...ids])); } catch { /* noop */ }
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

  const myParticipant = conversation.participants.find((p) => p.userId === currentUserId);
  const isArchived = myParticipant?.isArchived ?? false;
  const isPinned   = myParticipant?.isPinned   ?? false;
  const isMuted    = myParticipant?.isMuted    ?? false;
  const isGroup    = conversation.type === ConversationType.GROUP;

  const [isLocked,    setIsLocked]    = useState(false);
  const [isFavorite,  setIsFavorite]  = useState(false);
  const [showSetPin,  setShowSetPin]  = useState(false);

  useEffect(() => {
    if (open) {
      setIsLocked(getSet('cc_locked_convs').has(conversation.id));
      setIsFavorite(getSet('cc_fav_convs').has(conversation.id));
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
    onSuccess: () => { invalidate(); toast.success('Chat cleared'); onClose(); },
    onError: () => toast.error('Failed to clear chat'),
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveConversation(conversation.id),
    onSuccess: () => { invalidate(); toast.success('Left group'); onClose(); },
    onError: () => toast.error('Failed to leave group'),
  });

  // ── Lock / Unlock ──────────────────────────────────────────────────────────

  const handleToggleLock = () => {
    const locked = getSet('cc_locked_convs');
    if (isLocked) {
      // Unlock immediately — no PIN required to unlock, only to open
      locked.delete(conversation.id);
      saveSet('cc_locked_convs', locked);
      setIsLocked(false);
      toast.success('Chat unlocked');
      onClose();
    } else {
      // Lock: check if a global PIN exists first
      if (!getChatPin()) {
        setShowSetPin(true); // open set-PIN modal
      } else {
        locked.add(conversation.id);
        saveSet('cc_locked_convs', locked);
        setIsLocked(true);
        toast.success('Chat locked');
        onClose();
      }
    }
  };

  const handlePinSet = () => {
    // PIN was just created — now lock the chat
    const locked = getSet('cc_locked_convs');
    locked.add(conversation.id);
    saveSet('cc_locked_convs', locked);
    setShowSetPin(false);
    toast.success('Chat locked');
    onClose();
  };

  // ── Favorites ─────────────────────────────────────────────────────────────

  const handleToggleFavorite = () => {
    const favs = getSet('cc_fav_convs');
    if (isFavorite) { favs.delete(conversation.id); } else { favs.add(conversation.id); }
    saveSet('cc_fav_convs', favs);
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    onClose();
  };

  // ── Clear / Delete ─────────────────────────────────────────────────────────

  const handleClearChat = () => {
    if (!confirm('Clear all messages? This only affects your view.')) return;
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

  const isPending = settingsMutation.isPending || leaveMutation.isPending || clearMutation.isPending;

  const otherParticipant = conversation.participants.find((p) => p.userId !== currentUserId);
  const displayName = isGroup
    ? (conversation.name ?? 'Group')
    : otherParticipant
      ? `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`
      : 'Conversation';

  return (
    <>
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

            <p className="text-sm font-semibold text-foreground text-center pb-3 px-4 truncate">
              {displayName}
            </p>

            <div className="border-t border-border" />

            <div className="py-2">
              <button
                onClick={() => settingsMutation.mutate({ isArchived: !isArchived })}
                disabled={isPending}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-foreground hover:bg-surface-alt transition-colors disabled:opacity-50"
              >
                {isArchived ? <ArchiveRestore className="w-4 h-4 text-foreground-secondary" /> : <Archive className="w-4 h-4 text-foreground-secondary" />}
                {isArchived ? 'Unarchive' : 'Archive'}
              </button>

              <button
                onClick={handleToggleLock}
                disabled={isPending}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-foreground hover:bg-surface-alt transition-colors disabled:opacity-50"
              >
                {isLocked ? <LockOpen className="w-4 h-4 text-foreground-secondary" /> : <Lock className="w-4 h-4 text-foreground-secondary" />}
                <span className="flex-1 text-left">
                  {isLocked ? 'Unlock chat' : 'Lock chat'}
                  <span className="block text-[11px] text-foreground-muted font-normal">
                    {isLocked ? 'Remove PIN protection' : 'Require PIN to open'}
                  </span>
                </span>
              </button>

              <button
                onClick={() => settingsMutation.mutate({ isPinned: !isPinned })}
                disabled={isPending}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-foreground hover:bg-surface-alt transition-colors disabled:opacity-50"
              >
                {isPinned ? <PinOff className="w-4 h-4 text-foreground-secondary" /> : <Pin className="w-4 h-4 text-foreground-secondary" />}
                {isPinned ? 'Unpin' : 'Pin'}
              </button>

              <button
                onClick={() => settingsMutation.mutate({ markAsUnread: true })}
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
                {isFavorite ? <StarOff className="w-4 h-4 text-foreground-secondary" /> : <Star className="w-4 h-4 text-foreground-secondary" />}
                {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              </button>

              <button
                onClick={() => settingsMutation.mutate({ isMuted: !isMuted })}
                disabled={isPending}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-foreground hover:bg-surface-alt transition-colors disabled:opacity-50"
              >
                {isMuted ? <Bell className="w-4 h-4 text-foreground-secondary" /> : <BellOff className="w-4 h-4 text-foreground-secondary" />}
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
                {isGroup ? <LogOut className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                {isGroup ? 'Leave group' : 'Delete chat'}
              </button>
            </div>

            <div className="h-safe-area-inset-bottom" />
          </div>
        </div>
      </ClientPortal>

      {/* PIN setup modal — opened inline when first locking */}
      <PinEntryModal
        mode="set"
        open={showSetPin}
        onSuccess={handlePinSet}
        onClose={() => setShowSetPin(false)}
        title="Set a chat PIN"
        subtitle="You'll need this PIN to open any locked chat"
      />
    </>
  );
}
