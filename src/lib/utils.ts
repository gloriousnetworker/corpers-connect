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
 * Inserts Cloudinary delivery transformations (high-quality auto-format) into
 * a full Cloudinary URL so images are served at best quality without re-uploading.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function getOptimisedUrl(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  // Insert quality/format transforms right after /upload/
  return url.replace('/upload/', '/upload/q_auto:best,f_auto/');
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
