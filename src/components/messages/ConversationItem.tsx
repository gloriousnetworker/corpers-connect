'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Users } from 'lucide-react';
import { formatRelativeTime, getInitials, getAvatarUrl } from '@/lib/utils';
import type { Conversation } from '@/types/models';
import { ConversationType, MessageType } from '@/types/enums';

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
  isActive?: boolean;
  isOnline?: boolean;
  onClick: () => void;
  onLongPress?: () => void;
}

function getConversationDisplay(conv: Conversation, currentUserId: string) {
  if (conv.type === ConversationType.DM) {
    const other = conv.participants.find((p) => p.userId !== currentUserId);
    return {
      name: other ? `${other.user.firstName} ${other.user.lastName}` : 'Unknown',
      avatar: other?.user.profilePicture ?? null,
      initials: other ? getInitials(other.user.firstName, other.user.lastName) : '?',
      isGroup: false,
      otherId: other?.userId,
    };
  }
  return {
    name: conv.name ?? 'Group',
    avatar: conv.picture ?? null,
    initials: (conv.name ?? 'G').slice(0, 2).toUpperCase(),
    isGroup: true,
    otherId: undefined,
  };
}

function getLastMessagePreview(conv: Conversation, currentUserId: string): string {
  const msg = conv.lastMessage;
  if (!msg) return 'No messages yet';
  if (msg.isDeleted) return 'Message deleted';
  const isOwn = msg.senderId === currentUserId;
  const prefix = isOwn ? 'You: ' : conv.type === ConversationType.GROUP ? `${msg.sender.firstName}: ` : '';
  if (msg.type === MessageType.IMAGE) return `${prefix}📷 Photo`;
  if (msg.type === MessageType.VIDEO) return `${prefix}🎥 Video`;
  if (msg.type === MessageType.AUDIO) return `${prefix}🎵 Audio`;
  if (msg.type === MessageType.FILE) return `${prefix}📄 File`;
  return `${prefix}${msg.content ?? ''}`;
}

export default function ConversationItem({
  conversation,
  currentUserId,
  isActive,
  isOnline,
  onClick,
  onLongPress,
}: ConversationItemProps) {
  const display = getConversationDisplay(conversation, currentUserId);
  const preview = getLastMessagePreview(conversation, currentUserId);
  const timestamp = conversation.lastMessage?.createdAt ?? conversation.updatedAt;
  const hasUnread = conversation.unreadCount > 0;

  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const didLongPressRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!onLongPress) return;
    didLongPressRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    pressTimerRef.current = setTimeout(() => {
      didLongPressRef.current = true;
      onLongPress();
    }, 500);
  };

  const cancelPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    startPosRef.current = null;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPosRef.current) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 10) cancelPress();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (didLongPressRef.current) {
      didLongPressRef.current = false;
      e.preventDefault();
      return;
    }
    onClick();
  };

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isActive
          ? 'bg-primary/10'
          : 'hover:bg-surface-alt active:bg-surface-alt'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
          {display.avatar ? (
            <Image
              src={getAvatarUrl(display.avatar, 96)}
              alt={display.name}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          ) : display.isGroup ? (
            <Users className="w-5 h-5 text-primary" />
          ) : (
            <span className="font-bold text-primary text-sm uppercase">{display.initials}</span>
          )}
        </div>
        {/* Online dot */}
        {isOnline && !display.isGroup && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-surface rounded-full" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`text-sm font-semibold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
            {display.name}
          </span>
          <span className="text-[10px] text-foreground-muted flex-shrink-0">
            {formatRelativeTime(timestamp)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-xs truncate ${hasUnread ? 'font-medium text-foreground' : 'text-foreground-muted'}`}>
            {preview}
          </p>
          {hasUnread && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
