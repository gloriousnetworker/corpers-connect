'use client';

import { useState, useCallback } from 'react';
import { Edit3 } from 'lucide-react';
import ConversationList from '@/components/messages/ConversationList';
import ChatView from '@/components/messages/ChatView';
import NewConversationModal from '@/components/messages/NewConversationModal';
import { useSocket } from '@/hooks/useSocket';
import { useMessagesStore } from '@/store/messages.store';
import type { Conversation } from '@/types/models';

/**
 * MessagesSection — full Phase-4 messaging layout.
 *
 * Desktop (≥ lg): two-column split — conversation list (w-80) | chat panel (flex-1)
 * Mobile        : single column — list OR chat (slide via activeConversationId)
 */
export default function MessagesSection() {
  // Initialise Socket.IO for real-time messaging
  useSocket();

  const { activeConversationId, setActiveConversation } = useMessagesStore();
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setSelectedConversation(conv);
    setActiveConversation(conv.id);
  }, [setActiveConversation]);

  const handleBack = useCallback(() => {
    setSelectedConversation(null);
    setActiveConversation(null);
  }, [setActiveConversation]);

  const handleNewConversation = useCallback((conversationId: string) => {
    setNewConvOpen(false);
    setSelectedConversation(null);
    setActiveConversation(conversationId);
  }, [setActiveConversation]);

  const showChat = !!activeConversationId;

  return (
    <>
      {/* ── Desktop: two-column split ── */}
      <div className="hidden lg:flex h-full overflow-hidden">
        {/* Left: conversation list */}
        <div className="w-80 flex-shrink-0 border-r border-border flex flex-col h-full overflow-hidden">
          <ListHeader onNew={() => setNewConvOpen(true)} />
          <div className="flex-1 overflow-y-auto overscroll-y-none">
            <ConversationList
              activeConversationId={activeConversationId}
              onSelect={handleSelectConversation}
            />
          </div>
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
          /* Chat view */
          <ChatView
            key={activeConversationId}
            conversation={selectedConversation}
            onBack={handleBack}
          />
        ) : (
          /* Conversation list */
          <>
            <ListHeader onNew={() => setNewConvOpen(true)} />
            <div className="flex-1 overflow-y-auto overscroll-y-none">
              <ConversationList
                activeConversationId={activeConversationId}
                onSelect={handleSelectConversation}
              />
            </div>
          </>
        )}
      </div>

      {/* New conversation modal */}
      <NewConversationModal
        open={newConvOpen}
        onClose={() => setNewConvOpen(false)}
        onCreated={handleNewConversation}
      />
    </>
  );
}

function ListHeader({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
      <h2 className="text-base font-bold text-foreground">Messages</h2>
      <button
        onClick={onNew}
        className="p-2 rounded-xl hover:bg-surface-alt transition-colors"
        aria-label="New conversation"
      >
        <Edit3 className="w-4 h-4 text-foreground-secondary" />
      </button>
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

