'use client';

import { CornerUpLeft, Copy, Share2, Pencil, Trash2 } from 'lucide-react';
import type { Message } from '@/types/models';
import { MessageType } from '@/types/enums';

interface MessageActionSheetProps {
  message: Message;
  isOwn: boolean;
  onClose: () => void;
  onReply?: () => void;
  onCopy?: () => void;
  onForward?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function getMessagePreview(message: Message): string {
  if (message.isDeleted) return 'Deleted message';
  if (message.type === MessageType.IMAGE) return '📷 Photo';
  if (message.type === MessageType.VIDEO) return '🎥 Video';
  if (message.type === MessageType.AUDIO) return '🎵 Voice note';
  return (message.content ?? '').slice(0, 100);
}

type ActionItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  danger?: boolean;
};

export default function MessageActionSheet({
  message,
  isOwn,
  onClose,
  onReply,
  onCopy,
  onForward,
  onEdit,
  onDelete,
}: MessageActionSheetProps) {
  const preview = getMessagePreview(message);

  const actions: ActionItem[] = [
    ...(onReply ? [{ label: 'Reply', icon: CornerUpLeft, onClick: onReply }] : []),
    ...(onCopy ? [{ label: 'Copy', icon: Copy, onClick: onCopy }] : []),
    ...(onForward ? [{ label: 'Forward', icon: Share2, onClick: onForward }] : []),
    ...(isOwn && message.type === MessageType.TEXT && !message.isDeleted && onEdit
      ? [{ label: 'Edit', icon: Pencil, onClick: onEdit }]
      : []),
    ...(isOwn && !message.isDeleted && onDelete
      ? [{ label: 'Delete', icon: Trash2, onClick: onDelete, danger: true as const }]
      : []),
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        role="menu"
        aria-label="Message actions"
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-sheet animate-slide-up"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Message preview */}
        <div className="mx-4 mb-3 px-3 py-2 bg-surface-alt rounded-xl">
          <p className="text-xs text-foreground-muted truncate">{preview || '\u00a0'}</p>
        </div>

        {/* Action rows */}
        <div>
          {actions.map(({ label, icon: Icon, onClick, danger }) => (
            <button
              key={label}
              role="menuitem"
              onClick={() => {
                onClick();
                onClose();
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 text-sm font-medium transition-colors active:bg-surface-alt ${
                danger ? 'text-danger' : 'text-foreground'
              }`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  danger ? 'text-danger' : 'text-foreground-secondary'
                }`}
              />
              {label}
            </button>
          ))}

          {/* Cancel */}
          <div className="px-4 pt-1 pb-6">
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-surface-alt text-sm font-semibold text-foreground transition-colors active:opacity-75"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
