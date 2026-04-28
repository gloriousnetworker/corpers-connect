'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { getMarketplaceConversations } from '@/lib/api/marketplace';
import { useMarketplaceStore } from '@/store/marketplace.store';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from '@/lib/query-keys';
import { formatRelativeTime, getInitials, getAvatarUrl, truncate } from '@/lib/utils';
import MarketerBadge from '@/components/persona/MarketerBadge';
import type { MarketplaceConversationInfo } from '@/types/models';

export default function MarketplaceConversations() {
  const user = useAuthStore((s) => s.user);
  const { goBack, openMarketplaceChat } = useMarketplaceStore();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.marketplaceConversations(),
    queryFn: () => getMarketplaceConversations(),
    staleTime: 30_000,
    enabled: !!user,
  });

  const conversations = data?.items ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border bg-surface flex-shrink-0">
        <button
          onClick={goBack}
          className="p-2 rounded-xl hover:bg-surface-alt active:bg-surface-alt transition-colors flex-shrink-0"
          aria-label="Back to marketplace"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Marketplace Messages</h1>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-1 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <div className="w-12 h-12 rounded-lg bg-surface-alt animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-surface-alt rounded animate-pulse w-2/3" />
                  <div className="h-2.5 bg-surface-alt rounded animate-pulse w-1/2" />
                  <div className="h-2.5 bg-surface-alt rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <p className="font-semibold text-foreground text-sm">
              No marketplace conversations yet
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              Start a chat from any listing to negotiate with sellers
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {conversations.map((conv) => (
              <ConversationRow
                key={conv.id}
                conv={conv}
                currentUserId={user?.id ?? ''}
                onTap={() => openMarketplaceChat(conv.conversationId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Single conversation row ──────────────────────────────────────────────────

interface ConversationRowProps {
  conv: MarketplaceConversationInfo;
  currentUserId: string;
  onTap: () => void;
}

function ConversationRow({ conv, currentUserId, onTap }: ConversationRowProps) {
  const isBuyer = conv.buyerId === currentUserId;
  const otherParty = isBuyer ? conv.seller : conv.buyer;
  const otherName = `${otherParty.firstName} ${otherParty.lastName}`;
  const otherInitials = getInitials(otherParty.firstName, otherParty.lastName);

  const thumbnail = conv.listing.images?.[0] ?? null;
  const lastMessage = conv.conversation?.lastMessage;
  const lastMessagePreview = lastMessage
    ? lastMessage.isDeleted
      ? 'Message deleted'
      : truncate(lastMessage.content ?? '(media)', 50)
    : 'No messages yet';
  const timestamp = lastMessage?.createdAt ?? conv.createdAt;

  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-alt active:bg-surface-alt transition-colors"
    >
      {/* Listing thumbnail */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-alt flex items-center justify-center">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={conv.listing.title}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          ) : (
            <ShoppingBag className="w-5 h-5 text-foreground-muted" />
          )}
        </div>
        {/* Other party avatar badge */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full overflow-hidden bg-primary/10 border-2 border-surface flex items-center justify-center">
          {otherParty.profilePicture ? (
            <Image
              src={getAvatarUrl(otherParty.profilePicture, 48)}
              alt={otherName}
              width={24}
              height={24}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-[8px] font-bold text-primary uppercase">{otherInitials}</span>
          )}
        </div>
      </div>

      {/* Text area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-foreground truncate">
            {truncate(conv.listing.title, 28)}
          </span>
          <span className="text-[10px] text-foreground-muted flex-shrink-0">
            {formatRelativeTime(timestamp)}
          </span>
        </div>
        <p className="text-xs text-foreground-muted truncate mt-0.5 flex items-center gap-1.5">
          <span className="truncate">{isBuyer ? 'Seller' : 'Buyer'}: {otherName}</span>
          <MarketerBadge
            accountType={(otherParty as { accountType?: string }).accountType}
            size="sm"
          />
        </p>
        <p className="text-xs text-foreground-muted truncate mt-0.5">
          {lastMessagePreview}
        </p>
      </div>
    </button>
  );
}
