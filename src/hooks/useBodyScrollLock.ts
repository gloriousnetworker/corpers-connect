import { useEffect } from 'react';

/**
 * Locks document.body scroll while `locked` is true.
 * Restores the previous overflow value on cleanup.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}
