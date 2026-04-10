'use client';

import { useState, useCallback, useEffect } from 'react';
import { Edit3, Users } from 'lucide-react';
import ConversationList from '@/components/messages/ConversationList';
import ChatView from '@/components/messages/ChatView';
import NewConversationModal from '@/components/messages/NewConversationModal';
import GroupCreationModal from '@/components/messages/GroupCreationModal';
import ArchivedConversations from '@/components/messages/ArchivedConversations';
import PinEntryModal from '@/components/messages/PinEntryModal';
import { useMessagesStore } from '@/store/messages.store';
import type { Conversation } from '@/types/models';

function getLockedIds(): Set<string> {
  try {
    const raw = localStorage.getItem('cc_locked_convs');
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}

export default function MessagesSection() {
  const activeConversationId = useMessagesStore((s) => s.activeConversationId);
  const setActiveConversation = useMessagesStore((s) => s.setActiveConversation);
  const pendingConversation = useMessagesStore((s) => s.pendingConversation);
  const setPendingConversation = useMessagesStore((s) => s.setPendingConversation);

  const [newConvOpen, setNewConvOpen] = useState(false);
  const [groupConvOpen, setGroupConvOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [view, setView] = useState<'conversations' | 'archived'>('conversations');

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
      // Show PIN entry modal before opening
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

  // Shared conversation list panel
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

  return (
    <>
      {/* ── Desktop: two-column split ── */}
      <div className="hidden lg:flex h-full overflow-hidden">
        {/* Left panel */}
        <div className="w-80 flex-shrink-0 border-r border-border flex flex-col h-full overflow-hidden">
          {view === 'archived' ? ArchivePanel : (
            <>
              <ListHeader onNew={() => setNewConvOpen(true)} onNewGroup={() => setGroupConvOpen(true)} />
              <div className="flex-1 overflow-y-auto overscroll-y-none">
                {ConvListPanel}
              </div>
            </>
          )}
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
        ) : (
          <>
            <ListHeader onNew={() => setNewConvOpen(true)} onNewGroup={() => setGroupConvOpen(true)} />
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

function ListHeader({ onNew, onNewGroup }: { onNew: () => void; onNewGroup: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
      <h2 className="text-base font-bold text-foreground">Messages</h2>
      <div className="flex items-center gap-1">
        <button
          onClick={onNewGroup}
          className="p-2 rounded-xl hover:bg-surface-alt transition-colors"
          aria-label="New group"
        >
          <Users className="w-4 h-4 text-foreground-secondary" />
        </button>
        <button
          onClick={onNew}
          className="p-2 rounded-xl hover:bg-surface-alt transition-colors"
          aria-label="New conversation"
        >
          <Edit3 className="w-4 h-4 text-foreground-secondary" />
        </button>
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
