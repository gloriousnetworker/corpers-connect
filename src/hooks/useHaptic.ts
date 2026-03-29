'use client';

/**
 * useHaptic — lightweight wrapper around navigator.vibrate() for
 * native-feeling touch feedback in the PWA.
 *
 * Vibration is silently ignored on:
 *  - Browsers without the Vibration API (iOS Safari, some desktop)
 *  - Devices where vibration is disabled by the OS
 *
 * Usage:
 *   const haptic = useHaptic();
 *   haptic.light();   // quick tap (button press)
 *   haptic.medium();  // moderate feedback (like, follow)
 *   haptic.heavy();   // strong feedback (delete, error)
 *   haptic.success(); // double-tap pattern (success confirm)
 *   haptic.error();   // error buzz pattern
 */

const vibrate = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // silently ignore — some browsers throw on vibrate
    }
  }
};

export function useHaptic() {
  return {
    /** Very brief tap — icon toggles, chip selects */
    light: () => vibrate(20),
    /** Standard feedback — likes, bookmarks, follows */
    medium: () => vibrate(40),
    /** Strong tap — sends, submits, destructive confirmations */
    heavy: () => vibrate(70),
    /** Double-pulse — success (message sent, post liked) */
    success: () => vibrate([30, 50, 30]),
    /** Three short buzzes — error or invalid action */
    error: () => vibrate([50, 30, 50, 30, 50]),
    /** Custom pattern */
    custom: (pattern: number | number[]) => vibrate(pattern),
  };
}
