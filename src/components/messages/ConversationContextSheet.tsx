'use client';

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
} from 'lucide-react';
import {
  updateConversationSettings,
  leaveConversation,
} from '@/lib/api/conversations';
import { queryKeys } from '@/lib/query-keys';
import ClientPortal from '@/components/ui/ClientPortal';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { ConversationType } from '@/types/enums';
import type { Conversation } from '@/types/models';

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
    (p) => p.userId === currentUserId
  );
  const isArchived = myParticipant?.isArchived ?? false;
  const isPinned = myParticipant?.isPinned ?? false;
  const isMuted = myParticipant?.isMuted ?? false;
  const isGroup = conversation.type === ConversationType.GROUP;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
  };

  const settingsMutation = useMutation({
    mutationFn: (settings: Parameters<typeof updateConversationSettings>[1]) =>
      updateConversationSettings(conversation.id, settings),
    onSuccess: () => { invalidate(); onClose(); },
    onError: () => toast.error('Failed to update conversation'),
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

  if (!open) return null;

  const isPending = settingsMutation.isPending || leaveMutation.isPending;

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
          {/* Handle / header */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Conversation name */}
          <p className="text-sm font-semibold text-foreground text-center pb-3 px-4 truncate">
            {isGroup
              ? (conversation.name ?? 'Group')
              : conversation.participants.find((p) => p.userId !== currentUserId)?.user
                  ? `${conversation.participants.find((p) => p.userId !== currentUserId)!.user.firstName} ${conversation.participants.find((p) => p.userId !== currentUserId)!.user.lastName}`
                  : 'Conversation'
            }
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
                : <Archive className="w-4 h-4 text-foreground-secondary" />
              }
              {isArchived ? 'Unarchive' : 'Archive'}
            </button>

            <button
              onClick={() => settingsMutation.mutate({ isPinned: !isPinned })}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-foreground hover:bg-surface-alt transition-colors disabled:opacity-50"
            >
              {isPinned
                ? <PinOff className="w-4 h-4 text-foreground-secondary" />
                : <Pin className="w-4 h-4 text-foreground-secondary" />
              }
              {isPinned ? 'Unpin' : 'Pin'}
            </button>

            <button
              onClick={() => settingsMutation.mutate({ isMuted: !isMuted })}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-foreground hover:bg-surface-alt transition-colors disabled:opacity-50"
            >
              {isMuted
                ? <Bell className="w-4 h-4 text-foreground-secondary" />
                : <BellOff className="w-4 h-4 text-foreground-secondary" />
              }
              {isMuted ? 'Unmute' : 'Mute'}
            </button>

            <div className="my-1 border-t border-border/60" />

            {isGroup ? (
              <button
                onClick={() => leaveMutation.mutate()}
                disabled={isPending}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-danger hover:bg-danger/5 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                Leave group
              </button>
            ) : (
              <button
                onClick={() => {
                  // For DMs we archive instead of delete (backend doesn't expose hard-delete for DMs)
                  settingsMutation.mutate({ isArchived: true });
                }}
                disabled={isPending}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-danger hover:bg-danger/5 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete chat
              </button>
            )}
          </div>

          {/* Safe area spacer */}
          <div className="h-safe-area-inset-bottom" />
        </div>
      </div>
    </ClientPortal>
  );
}
