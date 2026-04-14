// All HTTP API calls go through the Next.js reverse-proxy (/api/proxy/*).
// This makes them same-origin, so browser cookie policies (SameSite, ITP)
// never block the httpOnly auth cookies.  WS_URL is the only direct Railway
// connection — Socket.IO cannot go through an HTTP proxy.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || '/api/proxy';

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  'https://corpers-connect-server-production.up.railway.app';

export const APP_NAME = 'Corpers Connect';
export const APP_TAGLINE = "Connecting Nigeria's Corps Members";
export const LOGO_URL =
  'https://res.cloudinary.com/do4przxhk/image/upload/v1774311341/logo_f3h1jf.png';

// Storage keys
export const STORAGE_KEYS = {
  REFRESH_TOKEN: 'cc_refresh_token',
  USER: 'cc_user',
  SESSION_FLAG: 'cc_session',
  THEME: 'cc_theme',
  INSTALL_DISMISSED: 'cc_install_dismissed',
  INSTALL_DISMISSED_FOREVER: 'cc_install_dismissed_forever',
  ONBOARDING_STEP: 'cc_onboarding_step',
  REG_STATE: 'cc_reg_state',
} as const;

// Dismiss install prompt for 7 days
export const INSTALL_DISMISS_DAYS = 7;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MESSAGES_PAGE_SIZE = 30;

// Post limits
export const MAX_POST_LENGTH = 2000;
export const MAX_BIO_LENGTH = 160;
export const MAX_MEDIA_PER_POST = 4;

// Image constraints
export const MAX_AVATAR_SIZE_MB = 5;
export const MAX_LISTING_IMAGES = 10;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

// OTP
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

// Token
export const ACCESS_TOKEN_EXPIRY_MINUTES = 15;

// Nigerian states (NYSC serving states)
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
] as const;

// Level display
export const LEVEL_CONFIG = {
  OTONDO: {
    label: 'Otondo',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    description: 'New corper',
  },
  KOPA: {
    label: 'Kopa',
    color: '#008751',
    bgColor: '#E8F5EE',
    description: 'Active corper (30+ days)',
  },
  CORPER: {
    label: 'Corper',
    color: '#C8992A',
    bgColor: '#FFF8E7',
    description: 'Premium member',
  },
} as const;

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    id: 'MONTHLY',
    name: 'Monthly',
    price: 150000,
    priceFormatted: '₦1,500',
    durationDays: 30,
    currency: 'NGN',
  },
  ANNUAL: {
    id: 'ANNUAL',
    name: 'Annual',
    price: 1400000,
    priceFormatted: '₦14,000',
    durationDays: 365,
    currency: 'NGN',
    savings: 'Save ₦4,000 vs monthly',
  },
} as const;

// Reaction emoji map
export const REACTION_EMOJI = {
  LIKE: '👍',
  LOVE: '❤️',
  FIRE: '🔥',
  CLAP: '👏',
} as const;

export const REACTION_LABEL = {
  LIKE: 'Like',
  LOVE: 'Love',
  FIRE: 'Fire',
  CLAP: 'Clap',
} as const;
