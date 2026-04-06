'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Smile } from 'lucide-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { EmojiStyle, Theme } from 'emoji-picker-react';

// Lazy-load the heavy picker bundle only when the user opens it
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => (
    <div className="w-[300px] h-[380px] flex items-center justify-center bg-surface rounded-2xl border border-border shadow-2xl">
      <span className="text-2xl animate-spin">😊</span>
    </div>
  ),
});

interface EmojiPickerPopoverProps {
  onEmojiSelect: (emoji: string) => void;
  /** Position the picker above (default) or below the button */
  placement?: 'above' | 'below';
}

export default function EmojiPickerPopover({ onEmojiSelect, placement = 'above' }: EmojiPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-alt transition-colors text-foreground-secondary hover:text-foreground"
        aria-label="Add emoji"
        aria-expanded={open}
      >
        <Smile className="w-4 h-4" />
      </button>

      {open && (
        <div
          className={`absolute ${placement === 'above' ? 'bottom-10' : 'top-10'} right-0 z-[9999] shadow-2xl rounded-2xl overflow-hidden`}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            emojiStyle={EmojiStyle.NATIVE}
            theme={Theme.LIGHT}
            searchPlaceholder="Search emoji..."
            width={300}
            height={380}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
}
