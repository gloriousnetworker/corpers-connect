'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  CornerUpLeft,
  Pencil,
  Trash2,
  RefreshCw,
  ZoomIn,
} from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import type { Message } from '@/types/models';
import { MessageType } from '@/types/enums';
import VoiceNotePlayer from './VoiceNotePlayer';
import MediaPreviewModal from './MediaPreviewModal';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  isGroup: boolean;
  /** Total number of participants in the conversation (used for blue tick logic) */
  participantCount?: number;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onRetry?: (message: Message) => void;
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  isGroup,
  participantCount = 2,
  onReply,
  onEdit,
  onDelete,
  onRetry,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isDeleted = message.isDeleted;
  const isPending = message._pending;
  const isFailed = message._failed;

  const bubbleBase = isOwn
    ? 'bg-primary text-white rounded-2xl rounded-br-sm ml-auto'
    : 'bg-surface border border-border text-foreground rounded-2xl rounded-bl-sm';

  const renderStatus = () => {
    if (!isOwn) return null;
    if (isFailed) return (
      <button
        onClick={() => onRetry?.(message)}
        className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
        aria-label="Retry sending"
      >
        <AlertCircle className="w-3 h-3" />
        <RefreshCw className="w-3 h-3" />
      </button>
    );
    if (isPending) return <Clock className="w-3 h-3 text-white/60 flex-shrink-0" />;

    const readBy = message.readBy ?? [];
    // Blue ticks: all other participants have read (participantCount - 1 others must have read)
    const allRead = readBy.length >= participantCount - 1 && readBy.length > 0;
    if (allRead) return <CheckCheck className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />;
    if (readBy.length > 0) return <CheckCheck className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />;
    return <Check className="w-3 h-3 text-white/60 flex-shrink-0" />;
  };

  const renderContent = () => {
    if (isDeleted) {
      return (
        <p className={`text-sm italic ${isOwn ? 'text-white/60' : 'text-foreground-muted'}`}>
          This message was deleted
        </p>
      );
    }

    if (message.type === MessageType.AUDIO && message.mediaUrl) {
      return <VoiceNotePlayer mediaUrl={message.mediaUrl} isOwn={isOwn} />;
    }

    if (message.type === MessageType.IMAGE && message.mediaUrl) {
      return (
        <div className="relative">
          <button
            onClick={() => setPreviewUrl(message.mediaUrl!)}
            className="relative w-52 h-52 rounded-xl overflow-hidden block group"
            aria-label="View full size"
          >
            <Image
              src={message.mediaUrl}
              alt="Image message"
              fill
              className="object-cover"
              sizes="208px"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
            </div>
          </button>
          {message.content && (
            <p className="mt-1 text-sm leading-relaxed">{message.content}</p>
          )}
        </div>
      );
    }

    if (message.type === MessageType.VIDEO && message.mediaUrl) {
      return (
        <button
          onClick={() => setPreviewUrl(message.mediaUrl!)}
          className="relative w-52 h-52 rounded-xl overflow-hidden block bg-black"
          aria-label="Play video"
        >
          <video src={message.mediaUrl} className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      );
    }

    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {message.content}
      </p>
    );
  };

  const initials = getInitials(message.sender.firstName, message.sender.lastName);

  // Determine media type for preview
  const isVideoMedia = message.type === MessageType.VIDEO ||
    message.mediaUrl?.match(/\.(mp4|webm|mov|ogg)$/i);

  return (
    <>
      <div
        className={`flex items-end gap-2 px-4 py-0.5 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Avatar — only for others */}
        {!isOwn && (
          <div className="w-7 h-7 flex-shrink-0">
            {showAvatar && (
              message.sender.profilePicture ? (
                <div className="relative w-7 h-7 rounded-full overflow-hidden">
                  <Image
                    src={message.sender.profilePicture}
                    alt={initials}
                    fill
                    className="object-cover"
                    sizes="28px"
                  />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary uppercase">{initials}</span>
                </div>
              )
            )}
          </div>
        )}

        <div className={`relative flex flex-col max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender name — group chats, first message in cluster */}
          {isGroup && !isOwn && showAvatar && (
            <span className="text-xs font-medium text-foreground-secondary mb-0.5 ml-1">
              {message.sender.firstName}
            </span>
          )}

          {/* Reply preview */}
          {message.replyTo && !isDeleted && (
            <div
              className={`text-xs mb-0.5 px-2 py-1 rounded-lg border-l-2 max-w-full ${
                isOwn
                  ? 'bg-white/10 border-white/40 text-white/70'
                  : 'bg-surface-alt border-primary/40 text-foreground-muted'
              }`}
            >
              <p className="font-medium truncate">
                {message.replyTo.sender.firstName}
              </p>
              <p className="truncate">
                {message.replyTo.isDeleted
                  ? 'Deleted message'
                  : message.replyTo.type === MessageType.IMAGE
                    ? '📷 Photo'
                    : message.replyTo.type === MessageType.AUDIO
                      ? '🎵 Voice note'
                      : message.replyTo.content
                }
              </p>
            </div>
          )}

          {/* Bubble */}
          <div
            className={`${bubbleBase} px-3 py-2 shadow-sm cursor-pointer select-text`}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowMenu((v) => !v);
            }}
            onClick={() => showMenu && setShowMenu(false)}
          >
            {renderContent()}

            {/* Edited badge */}
            {message.isEdited && !isDeleted && (
              <span className={`text-[10px] ${isOwn ? 'text-white/50' : 'text-foreground-muted'}`}>
                {' '}edited
              </span>
            )}
          </div>

          {/* Timestamp + status */}
          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-[10px] text-foreground-muted">
              {formatRelativeTime(message.createdAt)}
            </span>
            {renderStatus()}
          </div>

          {/* Context menu */}
          {showMenu && !isDeleted && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div
                className={`absolute z-20 mt-1 bg-surface border border-border rounded-xl shadow-xl py-1 min-w-[150px] ${
                  isOwn ? 'right-0' : 'left-0'
                }`}
                style={{ top: '100%' }}
              >
                {onReply && (
                  <button
                    onClick={() => { onReply(message); setShowMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-surface-alt transition-colors"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" /> Reply
                  </button>
                )}
                {isOwn && message.type === MessageType.TEXT && onEdit && (
                  <button
                    onClick={() => { onEdit(message); setShowMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-surface-alt transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
                {isOwn && onDelete && (
                  <button
                    onClick={() => { onDelete(message); setShowMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-danger hover:bg-surface-alt transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Media preview modal */}
      {previewUrl && (
        <MediaPreviewModal
          url={previewUrl}
          type={isVideoMedia ? 'video' : 'image'}
          caption={message.content}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </>
  );
}
