'use client';

import { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input, InputProps } from '@/components/ui/input';

interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightElement'> {
  showStrength?: boolean;
}

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-danger' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-warning' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-info' };
  return { score, label: 'Strong', color: 'bg-success' };
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrength = false, className, value, ...props }, ref) => {
    const [show, setShow] = useState(false);
    const strength = showStrength ? getPasswordStrength(String(value ?? '')) : null;

    return (
      <div className="space-y-2">
        <Input
          ref={ref}
          type={show ? 'text' : 'password'}
          value={value}
          className={cn(className)}
          autoComplete="current-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="p-1 text-foreground-muted hover:text-foreground transition-colors"
              aria-label={show ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {show ? (
                <EyeOff className="h-5 w-5" aria-hidden />
              ) : (
                <Eye className="h-5 w-5" aria-hidden />
              )}
            </button>
          }
          {...props}
        />
        {showStrength && strength && strength.label && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all duration-300',
                    bar <= strength.score ? strength.color : 'bg-surface-alt'
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-foreground-muted">
              Password strength:{' '}
              <span
                className={cn(
                  'font-medium',
                  strength.score <= 1 && 'text-danger',
                  strength.score === 2 && 'text-warning',
                  strength.score === 3 && 'text-info',
                  strength.score >= 4 && 'text-success'
                )}
              >
                {strength.label}
              </span>
            </p>
          </div>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
