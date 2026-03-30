import Image from 'next/image';
import { cn, getOptimisedUrl } from '@/lib/utils';

/**
 * Pre-computed base64 shimmer placeholder — avoids calling Buffer.from() at
 * runtime (which can cause issues in edge runtimes and costs a tiny bit of CPU
 * on every render).
 */
const BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjRThFQkVGIiBzdG9wLW9wYWNpdHk9IjEiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iI0YxRjNGNSIgc3RvcC1vcGFjaXR5PSIxIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRThFQkVGIiBzdG9wLW9wYWNpdHk9IjEiLz48YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJncmFkaWVudFRyYW5zZm9ybSIgdHlwZT0idHJhbnNsYXRlIiBmcm9tPSItMSAwIiB0bz0iMiAwIiBkdXI9IjEuNXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=';

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
 *  2. Falls back to a grey skeleton if src is empty/null
 *  3. Lazy-loads by default (priority=false)
 *  4. Automatically applies Cloudinary f_auto,q_auto:good transforms
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
      src={getOptimisedUrl(src, width)}
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
