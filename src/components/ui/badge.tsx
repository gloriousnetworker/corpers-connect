import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white',
        'primary-light': 'bg-primary-light text-primary',
        gold: 'bg-gold text-white',
        'gold-light': 'bg-gold-light text-gold',
        success: 'bg-success/15 text-success',
        warning: 'bg-warning/15 text-warning',
        danger: 'bg-danger/15 text-danger',
        info: 'bg-info/15 text-info',
        muted: 'bg-surface-alt text-foreground-secondary',
        outline: 'border border-border text-foreground-secondary bg-transparent',
        // Level badges
        otondo: 'bg-gray-100 text-gray-600',
        kopa: 'bg-primary-light text-primary',
        corper: 'bg-gold-light text-gold',
      },
    },
    defaultVariants: {
      variant: 'primary-light',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
