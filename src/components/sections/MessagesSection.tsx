'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Edit3, Users, Star } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import ConversationList from '@/components/messages/ConversationList';
import ChatView from '@/components/messages/ChatView';
import NewConversationModal from '@/components/messages/NewConversationModal';
import GroupCreationModal from '@/components/messages/GroupCreationModal';
import ArchivedConversations from '@/components/messages/ArchivedConversations';
import FavoritesPanel from '@/components/messages/FavoritesPanel';
import PinEntryModal from '@/components/messages/PinEntryModal';
import { useMessagesStore } from '@/store/messages.store';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from '@/lib/query-keys';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import { ConversationType } from '@/types/enums';
import type { Conversation } from '@/types/models';

function getLockedIds(): Set<string> {
  try {
    const raw = localStorage.getItem('cc_locked_convs');
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}

function getFavIds(): Set<string> {
  try {
    const raw = localStorage.getItem('cc_fav_convs');
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}

// ── Favorites preview button ──────────────────────────────────────────────────

interface FavoritesButtonProps {
  onClick: () => void;
}

function FavoritesButton({ onClick }: FavoritesButtonProps) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // Read from cache synchronously — no extra fetch
  const conversations = queryClient.getQueryData<Conversation[]>(queryKeys.conversations()) ?? [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const favIds = useMemo(() => getFavIds(), [conversations]);
  const favConvs = useMemo(
    () => conversations.filter((c) => favIds.has(c.id)),
    [conversations, favIds],
  );

  const previews = favConvs.slice(0, 3).map((conv) => {
    if (conv.type === ConversationType.GROUP) {
      return {
        avatar: conv.picture ?? null,
        initials: (conv.name ?? 'G').slice(0, 2).toUpperCase(),
        name: conv.name ?? 'Group',
      };
    }
    const other = conv.participants.find((p) => p.userId !== user?.id);
    return {
      avatar: other?.user.profilePicture ?? null,
      initials: other ? getInitials(other.user.firstName, other.user.lastName) : '?',
      name: other ? `${other.user.firstName} ${other.user.lastName}` : 'Unknown',
    };
  });

  const extra = favConvs.length - 3;

  if (favConvs.length === 0) {
    return (
      <button
        onClick={onClick}
        className="p-2 rounded-xl hover:bg-surface-alt transition-colors"
        aria-label="Favorites"
      >
        <Star className="w-4 h-4 text-foreground-secondary" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-surface-alt transition-colors"
      aria-label={`Favorites — ${favConvs.length} chat${favConvs.length !== 1 ? 's' : ''}`}
    >
      {/* Stacked avatar circles */}
      <div className="flex items-center">
        {previews.map((p, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded-full ring-2 ring-surface overflow-hidden flex-shrink-0 flex items-center justify-center bg-primary/10 ${i > 0 ? '-ml-2' : ''}`}
          >
            {p.avatar ? (
              <Image
                src={getAvatarUrl(p.avatar, 48)}
                alt={p.name}
                width={24}
                height={24}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-[8px] font-bold text-primary uppercase leading-none">
                {p.initials.slice(0, 1)}
              </span>
            )}
          </div>
        ))}
        {extra > 0 && (
          <div className="w-6 h-6 rounded-full ring-2 ring-surface bg-amber-100 dark:bg-amber-900/50 -ml-2 flex items-center justify-center flex-shrink-0">
            <span className="text-[8px] font-bold text-amber-600 dark:text-amber-400 leading-none">
              +{extra}
            </span>
          </div>
        )}
      </div>
      {/* Star badge */}
      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
    </button>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────

export default function MessagesSection() {
  const activeConversationId = useMessagesStore((s) => s.activeConversationId);
  const setActiveConversation = useMessagesStore((s) => s.setActiveConversation);
  const pendingConversation = useMessagesStore((s) => s.pendingConversation);
  const setPendingConversation = useMessagesStore((s) => s.setPendingConversation);

  const [newConvOpen, setNewConvOpen] = useState(false);
  const [groupConvOpen, setGroupConvOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [view, setView] = useState<'conversations' | 'archived' | 'favorites'>('conversations');

  // PIN lock state
  const [pendingLockedConv, setPendingLockedConv] = useState<Conversation | null>(null);

  // Open pending conversation from outside (e.g. "Message" button on a profile)
  useEffect(() => {
    if (pendingConversation) {
      handleSelectConversation(pendingConversation);
      setPendingConversation(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingConversation]);

  const openConversation = useCallback((conv: Conversation) => {
    setSelectedConversation(conv);
    setActiveConversation(conv.id);
  }, [setActiveConversation]);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    const locked = getLockedIds();
    if (locked.has(conv.id)) {
      setPendingLockedConv(conv);
    } else {
      openConversation(conv);
    }
  }, [openConversation]);

  const handlePinSuccess = useCallback(() => {
    if (pendingLockedConv) {
      openConversation(pendingLockedConv);
      setPendingLockedConv(null);
    }
  }, [pendingLockedConv, openConversation]);

  const handleBack = useCallback(() => {
    setSelectedConversation(null);
    setActiveConversation(null);
  }, [setActiveConversation]);

  const handleNewConversation = useCallback((conv: Conversation) => {
    setNewConvOpen(false);
    openConversation(conv);
  }, [openConversation]);

  const showChat = !!activeConversationId;

  const ConvListPanel = (
    <ConversationList
      activeConversationId={activeConversationId}
      onSelect={handleSelectConversation}
      onOpenArchived={() => setView('archived')}
    />
  );

  const ArchivePanel = (
    <ArchivedConversations
      onBack={() => setView('conversations')}
      onSelect={handleSelectConversation}
    />
  );

  const FavPanel = (
    <FavoritesPanel
      onBack={() => setView('conversations')}
      onSelect={handleSelectConversation}
    />
  );

  const renderLeftPanel = () => {
    if (view === 'archived') return ArchivePanel;
    if (view === 'favorites') return FavPanel;
    return (
      <>
        <ListHeader
          onNew={() => setNewConvOpen(true)}
          onNewGroup={() => setGroupConvOpen(true)}
          onOpenFavorites={() => setView('favorites')}
        />
        <div className="flex-1 overflow-y-auto overscroll-y-none">
          {ConvListPanel}
        </div>
      </>
    );
  };

  return (
    <>
      {/* ── Desktop: two-column split ── */}
      <div className="hidden lg:flex h-full overflow-hidden">
        {/* Left panel */}
        <div className="w-80 flex-shrink-0 border-r border-border flex flex-col h-full overflow-hidden">
          {renderLeftPanel()}
        </div>

        {/* Right: chat or empty */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {selectedConversation && activeConversationId ? (
            <ChatView
              key={activeConversationId}
              conversation={selectedConversation}
              onBack={handleBack}
            />
          ) : (
            <EmptyChat />
          )}
        </div>
      </div>

      {/* ── Mobile: list OR chat ── */}
      <div className="lg:hidden flex flex-col h-full overflow-hidden">
        {showChat && selectedConversation ? (
          <ChatView
            key={activeConversationId}
            conversation={selectedConversation}
            onBack={handleBack}
          />
        ) : view === 'archived' ? (
          ArchivePanel
        ) : view === 'favorites' ? (
          FavPanel
        ) : (
          <>
            <ListHeader
              onNew={() => setNewConvOpen(true)}
              onNewGroup={() => setGroupConvOpen(true)}
              onOpenFavorites={() => setView('favorites')}
            />
            <div className="flex-1 overflow-y-auto overscroll-y-none">
              {ConvListPanel}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <NewConversationModal
        open={newConvOpen}
        onClose={() => setNewConvOpen(false)}
        onCreated={handleNewConversation}
      />
      <GroupCreationModal
        open={groupConvOpen}
        onClose={() => setGroupConvOpen(false)}
        onCreated={handleNewConversation}
      />

      {/* PIN entry modal for locked chats */}
      <PinEntryModal
        mode="enter"
        open={!!pendingLockedConv}
        onSuccess={handlePinSuccess}
        onClose={() => setPendingLockedConv(null)}
        title="Chat is locked"
        subtitle={
          pendingLockedConv
            ? `Enter your PIN to open the chat with ${
                pendingLockedConv.participants.find((p) => p.userId !== pendingLockedConv.participants[0]?.userId)
                  ?.user.firstName ?? 'this contact'
              }`
            : undefined
        }
      />
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ListHeader({
  onNew,
  onNewGroup,
  onOpenFavorites,
}: {
  onNew: () => void;
  onNewGroup: () => void;
  onOpenFavorites: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
      <h2 className="text-base font-bold text-foreground">Messages</h2>
      <div className="flex items-center gap-1">
        {/* Favorites button — shows stacked avatar previews */}
        <div className="flex flex-col items-center gap-0.5">
          <FavoritesButton onClick={onOpenFavorites} />
          <span className="text-[9px] text-foreground-muted leading-none">Favourites</span>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={onNewGroup}
            className="p-2 rounded-xl hover:bg-surface-alt transition-colors"
            aria-label="New group"
          >
            <Users className="w-4 h-4 text-foreground-secondary" />
          </button>
          <span className="text-[9px] text-foreground-muted leading-none">New Group</span>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={onNew}
            className="p-2 rounded-xl hover:bg-surface-alt transition-colors"
            aria-label="New conversation"
          >
            <Edit3 className="w-4 h-4 text-foreground-secondary" />
          </button>
          <span className="text-[9px] text-foreground-muted leading-none">New Chat</span>
        </div>
      </div>
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Edit3 className="w-7 h-7 text-primary" />
      </div>
      <p className="font-semibold text-foreground">Your messages</p>
      <p className="text-sm text-foreground-secondary max-w-xs">
        Send private messages to your connections. Select a conversation to start chatting.
      </p>
    </div>
  );
}
