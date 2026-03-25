import { RefObject } from 'react';

/**
 * Inserts an emoji at the current cursor position inside an input or textarea.
 * Falls back to appending at the end if no cursor position is available.
 */
export function useEmojiInsertion<T extends HTMLInputElement | HTMLTextAreaElement>(
  ref: RefObject<T | null>,
  value: string,
  setter: (val: string) => void,
) {
  return (emoji: string) => {
    const el = ref.current;
    if (!el) {
      setter(value + emoji);
      return;
    }

    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const newVal = value.slice(0, start) + emoji + value.slice(end);
    setter(newVal);

    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };
}
