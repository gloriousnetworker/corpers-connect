'use client';

import Image from 'next/image';
import {
  Heart, MessageCircle, UserPlus, AtSign,
  MessageSquare, PhoneMissed, Star, Bell,
  TrendingUp, ShoppingBag, CheckCircle, XCircle,
} from 'lucide-react';
import { formatRelativeTime, getInitials, getAvatarUrl } from '@/lib/utils';
import { NotificationType } from '@/types/enums';
import type { Notification } from '@/types/models';

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
}

function getNotificationMeta(type: NotificationType): {
  icon: React.ElementType;
  color: string;
  bg: string;
} {
  switch (type) {
    case NotificationType.POST_LIKE:
      return { icon: Heart, color: 'text-primary', bg: 'bg-primary/10' };
    case NotificationType.POST_COMMENT:
    case NotificationType.COMMENT_REPLY:
      return { icon: MessageCircle, color: 'text-info', bg: 'bg-info/10' };
    case NotificationType.FOLLOW:
      return { icon: UserPlus, color: 'text-primary', bg: 'bg-primary/10' };
    case NotificationType.MENTION:
      return { icon: AtSign, color: 'text-purple-500', bg: 'bg-purple-50' };
    case NotificationType.DM_RECEIVED:
      return { icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' };
    case NotificationType.CALL_MISSED:
      return { icon: PhoneMissed, color: 'text-danger', bg: 'bg-danger/10' };
    case NotificationType.STORY_VIEW:
      return { icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' };
    case NotificationType.LEVEL_UP:
      return { icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' };
    case NotificationType.MARKET_INQUIRY:
      return { icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10' };
    case NotificationType.LISTING_APPROVED:
      return { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' };
    case NotificationType.LISTING_REJECTED:
      return { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10' };
    case NotificationType.BROADCAST:
    case NotificationType.SYSTEM:
    default:
      return { icon: Bell, color: 'text-foreground-muted', bg: 'bg-surface-alt' };
  }
}

export default function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const { actor, type, content, isRead, createdAt } = notification;
  const { icon: Icon, color, bg } = getNotificationMeta(type as NotificationType);
  const actorInitials = actor ? getInitials(actor.firstName, actor.lastName) : 'CC';

  return (
    <button
      onClick={onPress}
      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-alt ${
        !isRead ? 'bg-primary/5' : ''
      }`}
    >
      {/* Avatar or system icon */}
      <div className="relative flex-shrink-0">
        {actor ? (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
            {actor.profilePicture ? (
              <Image
                src={getAvatarUrl(actor.profilePicture, 80)}
                alt={actorInitials}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="font-bold text-primary text-xs uppercase">{actorInitials}</span>
            )}
          </div>
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        )}
        {/* Overlay action icon when there's an actor */}
        {actor && (
          <span className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center ${bg}`}>
            <Icon className={`w-3 h-3 ${color}`} />
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">
          {actor && (
            <span className="font-semibold">
              {actor.firstName} {actor.lastName}{' '}
            </span>
          )}
          <span className={actor ? 'font-normal text-foreground-secondary' : 'font-medium'}>
            {content}
          </span>
        </p>
        <p className="text-xs text-foreground-muted mt-0.5">{formatRelativeTime(createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!isRead && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
      )}
    </button>
  );
}
