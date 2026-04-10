'use client';

import { useState, useRef, useEffect } from 'react';
import { Lock, X, Eye, EyeOff } from 'lucide-react';
import ClientPortal from '@/components/ui/ClientPortal';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

const PIN_STORAGE_KEY = 'cc_chat_pin';

export function getChatPin(): string | null {
  try { return localStorage.getItem(PIN_STORAGE_KEY); } catch { return null; }
}

function saveChatPin(pin: string) {
  try { localStorage.setItem(PIN_STORAGE_KEY, pin); } catch { /* noop */ }
}

interface PinEntryModalProps {
  /** 'set' = create a new PIN (shown when locking for the first time), 'enter' = verify existing PIN */
  mode: 'set' | 'enter';
  open: boolean;
  onSuccess: () => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function PinEntryModal({
  mode,
  open,
  onSuccess,
  onClose,
  title,
  subtitle,
}: PinEntryModalProps) {
  useBodyScrollLock(open);

  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state whenever modal opens
  useEffect(() => {
    if (open) {
      setStep('enter');
      setPin('');
      setFirstPin('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setPin(digits);
    setError('');

    if (digits.length === 4) {
      if (mode === 'enter') {
        const saved = getChatPin();
        if (digits === saved) {
          onSuccess();
        } else {
          triggerShake();
          setError('Incorrect PIN');
          setTimeout(() => setPin(''), 600);
        }
      } else {
        // Set mode
        if (step === 'enter') {
          setFirstPin(digits);
          setStep('confirm');
          setPin('');
          setTimeout(() => inputRef.current?.focus(), 50);
        } else {
          // confirm step
          if (digits === firstPin) {
            saveChatPin(digits);
            onSuccess();
          } else {
            triggerShake();
            setError('PINs do not match. Try again.');
            setTimeout(() => {
              setStep('enter');
              setFirstPin('');
              setPin('');
            }, 700);
          }
        }
      }
    }
  };

  if (!open) return null;

  const displayTitle =
    title ??
    (mode === 'set'
      ? step === 'enter'
        ? 'Set a chat PIN'
        : 'Confirm your PIN'
      : 'Enter your PIN');

  const displaySubtitle =
    subtitle ??
    (mode === 'set'
      ? step === 'enter'
        ? 'This PIN will protect all your locked chats'
        : 'Re-enter the PIN to confirm'
      : 'Enter your PIN to open this chat');

  return (
    <ClientPortal>
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-xs bg-surface rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-surface-alt transition-colors"
            style={{ position: 'absolute' }}
          >
            <X className="w-4 h-4 text-foreground-secondary" />
          </button>

          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-7 h-7 text-primary" />
          </div>

          {/* Title */}
          <div className="text-center">
            <p className="font-semibold text-foreground">{displayTitle}</p>
            <p className="text-xs text-foreground-muted mt-1">{displaySubtitle}</p>
          </div>

          {/* PIN dots */}
          <div className={`flex gap-4 ${shake ? 'animate-shake' : ''}`}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  i < pin.length
                    ? 'bg-primary border-primary scale-110'
                    : 'bg-transparent border-border'
                }`}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-danger font-medium">{error}</p>
          )}

          {/* Hidden input captures keyboard */}
          <div className="relative">
            <input
              ref={inputRef}
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => handleInput(e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              aria-label="Enter PIN"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => { setShowPin((v) => !v); inputRef.current?.focus(); }}
              className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors px-3 py-2 rounded-lg border border-border"
            >
              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPin ? 'Hide' : 'Show'} PIN
            </button>
          </div>

          {/* Tap to type hint */}
          <p className="text-[11px] text-foreground-muted">Tap the button above to open the keypad</p>
        </div>
      </div>
    </ClientPortal>
  );
}
