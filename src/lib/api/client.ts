import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_URL, STORAGE_KEYS } from '../constants';
import { safeLocalStorage } from '../utils';
import type { ApiError, RefreshResponse } from '@/types/api';

// ── Create Axios instance ──────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── In-memory access token (never in localStorage) ─────────────────────────
let _accessToken: string | null = null;
let _refreshing = false;
let _refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// ── Request interceptor: attach Bearer token ───────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (_accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }
    // Disable timeout for file uploads so large videos don't time out
    if (config.data instanceof FormData) {
      config.timeout = 0;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 and auto-refresh ─────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401 when we had an active session.
    // If _accessToken is null we are on a public endpoint (e.g. login) — just
    // surface the server error rather than trying a pointless token refresh.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh' &&
      _accessToken !== null
    ) {
      originalRequest._retry = true;

      // If a refresh is already in progress, queue this request
      if (_refreshing) {
        return new Promise((resolve, reject) => {
          _refreshQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      _refreshing = true;

      try {
        const storage = safeLocalStorage();
        const refreshToken = storage.get(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post<{ success: true; data: RefreshResponse }>(
          `${API_URL}/api/v1/auth/refresh`,
          { refreshToken }
        );

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        // Persist new tokens
        setAccessToken(newAccessToken);
        storage.set(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

        // Flush queue
        _refreshQueue.forEach(({ resolve }) => resolve(newAccessToken));
        _refreshQueue = [];

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear session and redirect to login
        _refreshQueue.forEach(({ reject }) => reject(refreshError));
        _refreshQueue = [];
        setAccessToken(null);
        safeLocalStorage().remove(STORAGE_KEYS.REFRESH_TOKEN);
        safeLocalStorage().remove(STORAGE_KEYS.USER);
        safeLocalStorage().remove(STORAGE_KEYS.SESSION_FLAG);

        // Navigate to login (without importing Next.js router — use window)
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        _refreshing = false;
      }
    }

    // Normalize error message
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    return Promise.reject(new ApiRequestError(message, error.response?.status, error.response?.data));
  }
);

// ── Custom error class ─────────────────────────────────────────────────────
export class ApiRequestError extends Error {
  statusCode?: number;
  errors?: ApiError['errors'];

  constructor(message: string, statusCode?: number, data?: ApiError) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.errors = data?.errors;
  }
}

export default api;
