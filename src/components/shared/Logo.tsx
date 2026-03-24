import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'mark';
  className?: string;
  white?: boolean;
}

const sizeMap = {
  sm: { width: 80, height: 24, markSize: 28 },
  md: { width: 120, height: 36, markSize: 40 },
  lg: { width: 160, height: 48, markSize: 56 },
  xl: { width: 200, height: 60, markSize: 72 },
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
          src="/icons/logo.png"
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
        src="/logo.png"
        alt="Corpers Connect"
        fill
        className={cn('object-contain', white && 'brightness-0 invert')}
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
