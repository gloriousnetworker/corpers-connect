'use client';

import { Trash2, Users, X } from 'lucide-react';
import ClientPortal from '@/components/ui/ClientPortal';
import type { Message } from '@/types/models';

interface DeleteMessageSheetProps {
  message: Message;
  isOwn: boolean;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onClose: () => void;
}

function isWithin24Hours(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
}

export default function DeleteMessageSheet({
  message,
  isOwn,
  onDeleteForMe,
  onDeleteForEveryone,
  onClose,
}: DeleteMessageSheetProps) {
  const canDeleteForEveryone = isOwn && isWithin24Hours(message.createdAt);

  return (
    <ClientPortal>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9999] bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-surface rounded-t-3xl shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-4 pt-2 pb-2 flex items-center justify-between">
          <p className="font-semibold text-foreground">Delete message?</p>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-alt">
            <X className="w-4 h-4 text-foreground-secondary" />
          </button>
        </div>

        <div className="pb-6">
          {/* Delete for me */}
          <button
            onClick={() => { onDeleteForMe(); onClose(); }}
            className="w-full flex items-center gap-4 px-5 py-4 text-sm font-medium text-danger hover:bg-danger/5 transition-colors"
          >
            <Trash2 className="w-5 h-5 flex-shrink-0" />
            Delete for me
          </button>

          {/* Delete for everyone — only own messages within 24 hrs */}
          {isOwn && (
            <button
              onClick={() => { if (canDeleteForEveryone) { onDeleteForEveryone(); onClose(); } }}
              disabled={!canDeleteForEveryone}
              className={`w-full flex items-center gap-4 px-5 py-4 text-sm font-medium transition-colors ${
                canDeleteForEveryone
                  ? 'text-danger hover:bg-danger/5'
                  : 'text-foreground-muted cursor-not-allowed'
              }`}
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 text-left">
                Delete for everyone
                {!canDeleteForEveryone && (
                  <span className="block text-[11px] font-normal text-foreground-muted">
                    Only available within 24 hours of sending
                  </span>
                )}
              </span>
            </button>
          )}

          {/* Cancel */}
          <div className="px-4 pt-2">
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-surface-alt text-sm font-semibold text-foreground transition-colors active:opacity-75"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </ClientPortal>
  );
}
