'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  CornerUpLeft,
  RefreshCw,
  ZoomIn,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import type { Message } from '@/types/models';
import { MessageType } from '@/types/enums';
import VoiceNotePlayer from './VoiceNotePlayer';
import MediaPreviewModal from './MediaPreviewModal';
import MessageActionSheet from './MessageActionSheet';

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
  onForward?: (message: Message) => void;
  onReact?: (message: Message, emoji: string) => void;
  onPin?: (message: Message) => void;
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
  onForward,
  onReact,
  onPin,
}: MessageBubbleProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isDeleted = message.isDeleted;
  const isPending = message._pending;
  const isFailed = message._failed;
  const isMedia = !isDeleted && (message.type === MessageType.IMAGE || message.type === MessageType.VIDEO) && !!message.mediaUrl;

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTriggeredRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSwipingRef = useRef(false);

  const bubbleBase = isOwn
    ? 'bg-primary text-white rounded-2xl rounded-br-sm ml-auto'
    : 'bg-white dark:bg-slate-700 border border-border dark:border-slate-600 text-foreground rounded-2xl rounded-bl-sm';

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isDeleted || isPending || isFailed) return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setShowActionSheet(true);
    }, 500);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    if (dx > 8 || dy > 8) {
      if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
    }
  };
  const handlePointerUp = () => {
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
    pointerStartRef.current = null;
  };
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isDeleted) setShowActionSheet(true);
  };
  const handleRowClick = () => {
    if (longPressTriggeredRef.current) longPressTriggeredRef.current = false;
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDeleted) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isSwipingRef.current = false;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
    if (!isSwipingRef.current) {
      if (dx > 5 && dx > dy) isSwipingRef.current = true;
      else if (dy > dx) return;
    }
    if (isSwipingRef.current && dx > 0) setSwipeX(Math.min(dx, 80));
  };
  const handleTouchEnd = () => {
    if (swipeX >= 60 && onReply && !isDeleted) onReply(message);
    setSwipeX(0);
    touchStartRef.current = null;
    isSwipingRef.current = false;
  };
  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content).catch(() => {});
      toast('Copied');
    }
  };

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
        <div>
          <button
            onClick={() => setPreviewUrl(message.mediaUrl!)}
            className="relative w-52 h-52 block group"
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
            <p className="px-3 py-2 text-sm leading-relaxed">{message.content}</p>
          )}
        </div>
      );
    }

    if (message.type === MessageType.VIDEO && message.mediaUrl) {
      return (
        <button
          onClick={() => setPreviewUrl(message.mediaUrl!)}
          className="relative w-52 h-52 block bg-black"
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

  // Group reactions by emoji for the reaction row
  const reactionGroups = (message.reactions ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div
        className={`flex items-end gap-2 px-4 py-0.5 group select-none touch-pan-y ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={handleContextMenu}
        onClick={handleRowClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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

        <div
          className={`relative flex flex-col max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}
          style={{ transform: 'translateX(' + swipeX + 'px)', transition: swipeX === 0 ? 'transform 0.2s ease-out' : 'none' }}
        >
          {swipeX > 0 && (
            <div
              className="absolute -left-9 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ opacity: Math.min(swipeX / 60, 1) }}
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <CornerUpLeft className="w-4 h-4 text-primary" />
              </div>
            </div>
          )}

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
                  : 'bg-surface-alt dark:bg-slate-600 border-primary/40 text-foreground-muted'
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
            className={`${bubbleBase} ${isMedia ? 'p-0 overflow-hidden' : 'px-3 py-2'} shadow-sm cursor-pointer select-text`}
          >
            {renderContent()}

            {/* Edited badge */}
            {message.isEdited && !isDeleted && (
              <span className={`text-[10px] ${isOwn ? 'text-white/50' : 'text-foreground-muted'}`}>
                {' '}edited
              </span>
            )}
          </div>

          {/* Emoji reactions */}
          {Object.entries(reactionGroups).length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {Object.entries(reactionGroups).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => onReact?.(message, emoji)}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-surface border border-border text-xs shadow-sm active:scale-90 transition-transform"
                  aria-label={`${count} ${emoji} reaction${count > 1 ? 's' : ''}`}
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="text-foreground-secondary font-medium">{count}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Timestamp + status */}
          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-[10px] text-foreground-muted">
              {formatRelativeTime(message.createdAt)}
            </span>
            {renderStatus()}
          </div>
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

      {showActionSheet && (
        <MessageActionSheet
          message={message}
          isOwn={isOwn}
          onClose={() => setShowActionSheet(false)}
          onReply={onReply && !isDeleted ? () => onReply(message) : undefined}
          onCopy={message.type === MessageType.TEXT && !!message.content && !isDeleted ? handleCopy : undefined}
          onForward={onForward && !isDeleted ? () => onForward(message) : undefined}
          onEdit={onEdit && !isDeleted && message.type === MessageType.TEXT ? () => onEdit(message) : undefined}
          onDelete={onDelete && !isDeleted ? () => onDelete(message) : undefined}
          onReact={onReact ? (emoji) => onReact(message, emoji) : undefined}
          onPin={onPin ? () => onPin(message) : undefined}
        />
      )}
    </>
  );
}
