'use client';

import { useId } from 'react';

interface PriceInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Naira-prefixed numeric input. Strips non-numeric characters on change.
 */
export default function PriceInput({
  value,
  onChange,
  label = 'Price (₦)',
  placeholder = '0',
  required = false,
  disabled = false,
}: PriceInputProps) {
  const id = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    onChange(raw);
  };

  const formatted = value
    ? Number(value).toLocaleString('en-NG')
    : '';

  return (
    <div data-testid="price-input" className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <span className="absolute left-3 text-muted-foreground font-medium select-none">
          ₦
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={formatted}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={[
            'w-full pl-8 pr-4 py-2.5 rounded-lg border border-border bg-background',
            'text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          ].join(' ')}
        />
      </div>
    </div>
  );
}
