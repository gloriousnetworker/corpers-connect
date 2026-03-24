import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'mark';
  className?: string;
  white?: boolean;
}

const sizeMap = {
  sm: { width: 140, height: 36, markSize: 28 },
  md: { width: 180, height: 44, markSize: 40 },
  lg: { width: 220, height: 56, markSize: 56 },
  xl: { width: 260, height: 68, markSize: 72 },
};

export default function Logo({
  size = 'md',
  variant = 'full',
  className,
  white = false,
}: LogoProps) {
  const dims = sizeMap[size];

  if (variant === 'mark') {
    return (
      <div
        className={cn(
          'relative flex-shrink-0',
          className
        )}
        style={{ width: dims.markSize, height: dims.markSize }}
      >
        <Image
          src="/icons/icon-192x192.png"
          alt="Corpers Connect"
          fill
          className="object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div className={cn('relative flex-shrink-0', className)} style={{ width: dims.width, height: dims.height }}>
      <Image
        src="/corpersconnectlogo.jpg"
        alt="Corpers Connect"
        fill
        className={cn('object-contain object-left', white && 'brightness-0 invert')}
        priority
      />
    </div>
  );
}

// Text-only fallback logo (when image not available)
export function LogoText({
  size = 'md',
  white = false,
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  white?: boolean;
  className?: string;
}) {
  const textSizeMap = {
    sm: 'text-lg font-bold',
    md: 'text-2xl font-bold',
    lg: 'text-3xl font-extrabold',
  };

  return (
    <span
      className={cn(
        textSizeMap[size],
        white ? 'text-white' : 'text-primary',
        'font-sans tracking-tight',
        className
      )}
    >
      Corpers Connect
    </span>
  );
}
