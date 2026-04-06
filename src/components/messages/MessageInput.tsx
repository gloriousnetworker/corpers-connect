'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, CornerUpLeft, ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadMessageMedia } from '@/lib/api/conversations';
import { MessageType } from '@/types/enums';
import type { Message } from '@/types/models';
import VoiceNoteRecorder, { MicButton } from './VoiceNoteRecorder';
import EmojiPickerPopover from '@/components/ui/EmojiPickerPopover';

interface MessageInputProps {
  onSend: (content: string, replyToId?: string) => void;
  onSendMedia?: (mediaUrl: string, type: MessageType) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  editingMessage?: Message | null;
  onCancelEdit?: () => void;
}

function getReplyPreview(msg: Message): string {
  if (msg.isDeleted) return 'Deleted message';
  if (msg.type === MessageType.IMAGE) return '📷 Photo';
  if (msg.type === MessageType.AUDIO) return '🎵 Voice note';
  if (msg.type === MessageType.VIDEO) return '🎥 Video';
  if (msg.type === MessageType.FILE) return '📄 File';
  return msg.content ?? '';
}

export default function MessageInput({
  onSend,
  onSendMedia,
  onTypingStart,
  onTypingStop,
  replyTo,
  onCancelReply,
  disabled,
  editingMessage,
  onCancelEdit,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    // When editing, onSend receives (content, messageId)
    onSend(trimmed, replyTo?.id ?? editingMessage?.id);
    setText('');
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop();
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    textareaRef.current?.focus();
  }, [text, disabled, onSend, replyTo, editingMessage, onTypingStop]);

  // On mobile (coarse pointer) let the Return key insert a newline — send via the Send button.
  // On desktop, Enter sends; Shift+Enter inserts a newline.
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isMobile) return; // let the soft keyboard handle Return naturally
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Image / video file upload ──────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onSendMedia) return;
    e.target.value = ''; // reset so same file can be re-selected

    setUploading(true);
    try {
      const { url, mediaType } = await uploadMessageMedia(file);
      const msgType = mediaType.startsWith('video') ? MessageType.VIDEO : MessageType.IMAGE;
      onSendMedia(url, msgType);
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Voice note ─────────────────────────────────────────────────────────────
  const handleVoiceSend = useCallback(async (blob: Blob, _durationMs: number) => {
    setIsRecording(false);
    if (!onSendMedia) return;
    setUploading(true);
    try {
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
      const { url } = await uploadMessageMedia(file);
      onSendMedia(url, MessageType.AUDIO);
    } catch {
      toast.error('Failed to send voice note');
    } finally {
      setUploading(false);
    }
  }, [onSendMedia]);

  // ── Render recording state ─────────────────────────────────────────────────
  if (isRecording) {
    return (
      <VoiceNoteRecorder
        onSend={handleVoiceSend}
        onCancel={() => setIsRecording(false)}
      />
    );
  }

  const canSend = text.trim().length > 0 && !disabled;
  const showMic = !canSend && !editingMessage && !!onSendMedia;

  return (
    <div className="border-t border-border bg-surface">
      {/* Reply / Edit banner */}
      {(replyTo || editingMessage) && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/8 border-b border-primary/20 border-l-[3px] border-l-primary">
          <CornerUpLeft className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary">
              {editingMessage ? 'Editing message' : `Replying to ${replyTo?.sender.firstName}`}
            </p>
            <p className="text-xs text-foreground-muted truncate">
              {editingMessage
                ? (editingMessage.content ?? '')
                : getReplyPreview(replyTo!)
              }
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
        {/* Image upload button */}
        {onSendMedia && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || disabled}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-alt transition-colors flex-shrink-0 disabled:opacity-50 self-end mb-0.5"
              aria-label="Attach image or video"
            >
              {uploading
                ? <Loader2 className="w-5 h-5 text-foreground-muted animate-spin" />
                : <ImageIcon className="w-5 h-5 text-foreground-muted" />
              }
            </button>
          </>
        )}

        <div className="flex-1 flex items-end gap-1 bg-surface-alt rounded-2xl px-3 py-2 min-h-[44px]">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            disabled={disabled}
            maxLength={4000}
            enterKeyHint={isMobile ? 'enter' : 'send'}
            className="flex-1 bg-transparent text-foreground text-sm outline-none resize-none placeholder:text-foreground-muted leading-relaxed"
            style={{ fontSize: '16px' }}
          />
          <EmojiPickerPopover
            onEmojiSelect={(emoji) => {
              setText((prev) => prev + emoji);
              textareaRef.current?.focus();
            }}
            placement="above"
          />
        </div>

        {/* Send or Mic button */}
        {showMic ? (
          <MicButton onPress={() => setIsRecording(true)} />
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="w-11 h-11 rounded-full bg-primary flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-dark active:scale-95"
            aria-label={editingMessage ? 'Save edit' : 'Send message'}
          >
            <Send className="w-5 h-5 text-white" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
