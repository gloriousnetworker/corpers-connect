// Standard API response envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

// Paginated response
export interface PaginatedData<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]> | Array<{ field: string; message: string }>;
  statusCode?: number;
}

// Auth responses
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: import('./models').User;
}

export interface LoginWith2FAResponse {
  requiresTwoFactor: true;
  challengeToken: string;
  userId: string;
}

export interface RegisterInitiateResponse {
  email: string;
  maskedEmail: string;
  message: string;
}

export interface NyscLookupResponse {
  stateCode: string;
  firstName: string;
  lastName: string;
  email: string;
  maskedEmail: string;
  servingState: string;
  batch: string;
  phone?: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface Enable2FAResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

// Feed response
export interface FeedResponse {
  posts: import('./models').Post[];
  nextCursor: string | null;
  hasMore: boolean;
}
