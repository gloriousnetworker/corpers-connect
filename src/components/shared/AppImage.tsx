import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * A base64 SVG shimmer used as the blur placeholder for every AppImage.
 * It renders a grey rectangle that animates while the real image loads,
 * giving the same shimmer effect as the `.skeleton` CSS class.
 */
const SHIMMER_SVG = `
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#E8EBEF" stop-opacity="1"/>
      <stop offset="50%"  stop-color="#F1F3F5" stop-opacity="1"/>
      <stop offset="100%" stop-color="#E8EBEF" stop-opacity="1"/>
      <animateTransform attributeName="gradientTransform" type="translate"
        from="-1 0" to="2 0" dur="1.5s" repeatCount="indefinite"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g)"/>
</svg>`;

const BLUR_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(SHIMMER_SVG).toString('base64')}`;

interface AppImageProps {
  src: string | null | undefined;
  alt: string;
  /** Required for layout="fill" mode */
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  priority?: boolean;
  sizes?: string;
  onClick?: () => void;
}

/**
 * AppImage — drop-in replacement for `next/image` that:
 *  1. Shows a shimmer blur placeholder while loading
 *  2. Falls back to a grey background if the src is empty
 *  3. Lazy-loads by default (priority=false)
 *  4. All user-content images should use this component
 */
export default function AppImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className,
  objectFit = 'cover',
  priority = false,
  sizes,
  onClick,
}: AppImageProps) {
  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
  }[objectFit];

  if (!src) {
    return (
      <div
        className={cn('bg-surface-alt skeleton', className)}
        style={!fill ? { width, height } : undefined}
        aria-hidden="true"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      className={cn(objectFitClass, className)}
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
      loading={priority ? 'eager' : 'lazy'}
      priority={priority}
      sizes={sizes}
      onClick={onClick}
    />
  );
}
