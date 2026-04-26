import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNowStrict, format, isToday, isYesterday, parseISO } from 'date-fns';

// ── className utility ──────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ── Price formatting ───────────────────────────────────────────────────────
export function formatPrice(kobo: number): string {
  const naira = kobo / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(naira);
}

export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

export function nairaToKobo(naira: number): number {
  return naira * 100;
}

// ── Date formatting ───────────────────────────────────────────────────────
export function formatRelativeTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNowStrict(date, { addSuffix: true });
  } catch {
    return '';
  }
}

export function formatMessageTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd/MM/yyyy');
  } catch {
    return '';
  }
}

export function formatFullDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMMM d, yyyy');
  } catch {
    return '';
  }
}

export function formatShortDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMM d');
  } catch {
    return '';
  }
}

// ── String utilities ──────────────────────────────────────────────────────
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength).trim()}…`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  const masked = '*'.repeat(Math.max(0, local.length - 2));
  return `${visible}${masked}@${domain}`;
}

// ── State code validation ─────────────────────────────────────────────────
export function isValidStateCode(code: string): boolean {
  // Format: XX/YYA/NNNN e.g. AB/23A/1234 or KG/25C/1358
  return /^[A-Z]{2}\/\d{2}[A-Z]\/\d{3,5}$/i.test(code.trim());
}

// ── Number formatting ─────────────────────────────────────────────────────
export function formatCount(count: number): string {
  const n = Number.isFinite(count) ? count : 0;
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

// ── File utilities ────────────────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

// ── URL utilities ─────────────────────────────────────────────────────────

/**
 * Inserts Cloudinary delivery transforms into a full Cloudinary URL.
 * q_auto:good = auto quality balanced for speed (smaller than :best).
 * f_auto      = serve WebP/AVIF to supported browsers automatically.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function getOptimisedUrl(url: string, width?: number): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  // Avoid double-inserting transforms
  if (url.includes('/upload/f_auto') || url.includes('/upload/q_auto')) return url;
  const widthTransform = width ? `,w_${width}` : '';
  return url.replace('/upload/', `/upload/f_auto,q_auto:best${widthTransform}/`);
}

/**
 * Adds delivery transforms to a Cloudinary VIDEO URL so reel/story playback
 * stays smooth on slow networks.
 *  q_auto:eco — aggressive bitrate reduction with minimal visible loss.
 *  f_auto     — serves the lightest container the browser supports (mp4/webm).
 *  vc_auto    — picks the best video codec available (h264/vp9 etc.).
 *  w_720,c_limit — caps width at 720 without upscaling.
 *
 * Non-Cloudinary URLs are returned unchanged. Idempotent — won't double-stack
 * transforms if the URL already has them.
 */
export function getOptimisedVideoUrl(url: string, width = 720): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  if (!url.includes('/video/upload/')) return url;
  if (/\/upload\/[^/]*q_auto/.test(url) || /\/upload\/[^/]*f_auto/.test(url)) return url;
  const transforms = ['q_auto:eco', 'f_auto', 'vc_auto', `w_${width}`, 'c_limit'].join(',');
  return url.replace('/video/upload/', `/video/upload/${transforms}/`);
}

/**
 * Builds a Cloudinary first-frame poster URL for a video. Used as `<video poster>`
 * so the user sees the still frame instantly instead of a black screen while
 * the clip downloads. Returns '' for non-Cloudinary URLs (caller falls back).
 */
export function getVideoPoster(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return '';
  if (!url.includes('/video/upload/')) return '';
  return url
    .replace('/video/upload/', '/video/upload/so_0,q_auto:good,f_jpg,w_720,c_limit/')
    .replace(/\.(mp4|webm|mov|ogg)(\?.*)?$/i, '.jpg');
}

/**
 * Returns a properly-sized Cloudinary URL for avatars/profile pictures.
 * Serves a small square crop so full-resolution uploads aren't downloaded
 * just to render a 40px avatar.
 * @param size pixel size (default 80 — covers 1x and 2x @40px render)
 */
export function getAvatarUrl(url: string | null | undefined, size = 80): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com')) return url;
  if (url.includes('/upload/f_auto') || url.includes('/upload/q_auto')) return url;
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,f_auto,q_auto:best/`);
}

export function buildCloudinaryUrl(
  publicId: string,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'do4przxhk';
  const { width, height, quality = 80 } = options;
  const transforms = [
    'f_auto',
    `q_${quality}`,
    width ? `w_${width}` : null,
    height ? `h_${height}` : null,
    'c_fill',
  ]
    .filter(Boolean)
    .join(',');
  return `https://res.cloudinary.com/${cloud}/image/upload/${transforms}/${publicId}`;
}

// ── Storage utilities ─────────────────────────────────────────────────────
export function safeLocalStorage() {
  if (typeof window === 'undefined') {
    return {
      get: (_key: string) => null,
      set: (_key: string, _value: string) => {},
      remove: (_key: string) => {},
    };
  }
  return {
    get: (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // storage full or blocked
      }
    },
    remove: (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch {}
    },
  };
}

// ── Noop delay ────────────────────────────────────────────────────────────
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Debounce ──────────────────────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── Device detection ──────────────────────────────────────────────────────
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

export function isMobile(): boolean {
  return isIOS() || isAndroid();
}

export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
}
