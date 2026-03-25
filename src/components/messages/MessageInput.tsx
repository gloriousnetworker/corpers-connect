'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, CornerUpLeft, Image as ImageIcon } from 'lucide-react';
import type { Message } from '@/types/models';

interface MessageInputProps {
  onSend: (content: string, replyToId?: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  editingMessage?: Message | null;
  onCancelEdit?: () => void;
}

export default function MessageInput({
  onSend,
  onTypingStart,
  onTypingStop,
  replyTo,
  onCancelReply,
  disabled,
  editingMessage,
  onCancelEdit,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Pre-fill text when editing
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content ?? '');
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingStart();
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTypingStop();
    }, 2000);
  }, [onTypingStart, onTypingStop]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (e.target.value) handleTyping();
    else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTypingStop();
      }
    }
  };

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, replyTo?.id ?? editingMessage?.id);
    setText('');
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop();
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    textareaRef.current?.focus();
  }, [text, disabled, onSend, replyTo, editingMessage, onTypingStop]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <div className="border-t border-border bg-surface">
      {/* Reply / Edit banner */}
      {(replyTo || editingMessage) && (
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-alt border-b border-border">
          <CornerUpLeft className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary">
              {editingMessage ? 'Editing message' : `Replying to ${replyTo?.sender.firstName}`}
            </p>
            <p className="text-xs text-foreground-muted truncate">
              {(editingMessage ?? replyTo)?.content ?? ''}
            </p>
          </div>
          <button
            onClick={editingMessage ? onCancelEdit : onCancelReply}
            className="p-1 rounded-full hover:bg-surface-alt transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5 text-foreground-muted" />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 px-3 py-2">
        <div className="flex-1 flex items-end gap-2 bg-surface-alt rounded-2xl px-3 py-2 min-h-[44px]">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            disabled={disabled}
            maxLength={4000}
            className="flex-1 bg-transparent text-foreground text-sm outline-none resize-none placeholder:text-foreground-muted leading-relaxed"
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="w-11 h-11 rounded-full bg-primary flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-dark active:scale-95"
          aria-label={editingMessage ? 'Save edit' : 'Send message'}
        >
          <Send className="w-5 h-5 text-white" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
