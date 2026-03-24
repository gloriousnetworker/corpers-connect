'use client';

import { useRef, useState, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

export default function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [focused, setFocused] = useState<number | null>(autoFocus ? 0 : null);

  const digits = value.padEnd(length, '').slice(0, length).split('');

  function updateDigit(index: number, digit: string) {
    const newDigits = [...digits];
    newDigits[index] = digit.replace(/\D/g, '').slice(-1);
    const newValue = newDigits.join('').slice(0, length);
    onChange(newValue);
  }

  function handleChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      updateDigit(index, '');
      return;
    }

    // Handle paste-like multi-char input
    if (val.length > 1) {
      const newValue = val.slice(0, length);
      onChange(newValue);
      const nextIndex = Math.min(newValue.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    updateDigit(index, val);
    // Auto-advance to next box
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        updateDigit(index, '');
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        updateDigit(index - 1, '');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  }

  return (
    <div
      className="flex gap-2.5 justify-center"
      role="group"
      aria-label="One-time password input"
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          value={digits[i] ?? ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => setFocused(i)}
          onBlur={() => setFocused(null)}
          aria-label={`OTP digit ${i + 1}`}
          className={cn(
            'otp-box',
            digits[i] && 'filled',
            error && '!border-danger',
            focused === i && '!border-primary',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
      ))}
    </div>
  );
}
