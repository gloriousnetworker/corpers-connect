'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LoaderCircle } from 'lucide-react';

const buttonVariants = cva(
  // Base: full-width on mobile, touch-optimized, no zoom on tap
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.97] no-select',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark shadow-sm',
        secondary:
          'bg-primary-light text-primary hover:bg-primary-light/80 active:bg-primary-light/60',
        outline:
          'border-2 border-primary text-primary bg-transparent hover:bg-primary-light active:bg-primary-light',
        ghost:
          'bg-transparent text-foreground hover:bg-surface-alt active:bg-surface-alt',
        danger:
          'bg-danger text-white hover:bg-red-600 active:bg-red-700',
        'danger-outline':
          'border-2 border-danger text-danger bg-transparent hover:bg-danger/5',
        gold:
          'bg-gold text-white hover:bg-yellow-600 active:bg-yellow-700 shadow-sm',
        link:
          'text-primary underline-offset-4 hover:underline bg-transparent p-0 h-auto min-h-0 min-w-0',
      },
      size: {
        sm: 'h-10 px-4 text-sm rounded-lg',
        md: 'h-[52px] px-6 text-base',
        lg: 'h-14 px-8 text-lg',
        icon: 'h-11 w-11 rounded-xl p-0',
        'icon-sm': 'h-9 w-9 rounded-lg p-0',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      isLoading = false,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden />
            <span>{loadingText ?? 'Loading…'}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
