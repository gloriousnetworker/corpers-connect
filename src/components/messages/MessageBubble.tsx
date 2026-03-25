'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, CheckCheck, Clock, AlertCircle, CornerUpLeft, Pencil, Trash2 } from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import type { Message } from '@/types/models';
import { MessageType } from '@/types/enums';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  isGroup: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  isGroup,
  onReply,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);

  const isDeleted = message.isDeleted;
  const isPending = message._pending;
  const isFailed = message._failed;

  const bubbleBase = isOwn
    ? 'bg-primary text-white rounded-2xl rounded-br-sm ml-auto'
    : 'bg-surface border border-border text-foreground rounded-2xl rounded-bl-sm';

  const renderStatus = () => {
    if (!isOwn) return null;
    if (isFailed) return <AlertCircle className="w-3 h-3 text-red-300 flex-shrink-0" />;
    if (isPending) return <Clock className="w-3 h-3 text-white/60 flex-shrink-0" />;
    const readBy = message.readBy ?? [];
    if (readBy.length > 0) return <CheckCheck className="w-3.5 h-3.5 text-white/80 flex-shrink-0" />;
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

    if (message.type === MessageType.IMAGE && message.mediaUrl) {
      return (
        <div className="relative w-52 h-52 rounded-xl overflow-hidden">
          <Image
            src={message.mediaUrl}
            alt="Image message"
            fill
            className="object-cover"
            sizes="208px"
          />
          {message.content && (
            <p className="mt-1 text-sm leading-relaxed">{message.content}</p>
          )}
        </div>
      );
    }

    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {message.content}
      </p>
    );
  };

  const initials = getInitials(message.sender.firstName, message.sender.lastName);

  return (
    <div
      className={`flex items-end gap-2 px-4 py-0.5 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar — only for others in group or when showAvatar */}
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

      <div className={`flex flex-col max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
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
              {message.replyTo.isDeleted ? 'Deleted message' : message.replyTo.content}
            </p>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative ${bubbleBase} px-3 py-2 shadow-sm cursor-pointer select-text`}
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
          <div
            className={`absolute z-10 mt-1 bg-surface border border-border rounded-xl shadow-lg py-1 min-w-[140px] ${
              isOwn ? 'right-0' : 'left-0'
            }`}
            style={{ top: '100%' }}
          >
            {!isDeleted && onReply && (
              <button
                onClick={() => { onReply(message); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-alt transition-colors"
              >
                <CornerUpLeft className="w-3.5 h-3.5" /> Reply
              </button>
            )}
            {isOwn && message.type === MessageType.TEXT && onEdit && (
              <button
                onClick={() => { onEdit(message); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-alt transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            {isOwn && onDelete && (
              <button
                onClick={() => { onDelete(message); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-surface-alt transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
