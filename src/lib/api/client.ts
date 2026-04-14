import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_URL, STORAGE_KEYS } from '../constants';
import { safeLocalStorage } from '../utils';
import type { ApiError, RefreshResponse } from '@/types/api';

// ── Create Axios instance ──────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 15000,
  withCredentials: true, // send httpOnly refresh-token cookie on every request
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
    // For file uploads: remove the instance-level Content-Type so the browser's
    // XHR layer sets the correct multipart/form-data; boundary=... automatically.
    // Also disable the timeout so large videos don't abort mid-upload.
    if (config.data instanceof FormData) {
      config.timeout = 0;
      delete (config.headers as Record<string, unknown>)['Content-Type'];
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

    // Attempt refresh on 401 as long as we haven't already retried and this
    // isn't the refresh endpoint itself. We do NOT gate on _accessToken !== null
    // because after a page reload _accessToken is always null (in-memory only),
    // yet the httpOnly cc_refresh_token cookie is still valid.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh'
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
        // Cookie is sent automatically — no body needed.
        const { data } = await axios.post<{ success: true; data: RefreshResponse }>(
          `${API_URL}/api/v1/auth/refresh`,
          {},
          { timeout: 10_000, withCredentials: true }
        );

        const newAccessToken = data.data.accessToken;

        setAccessToken(newAccessToken);

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
        safeLocalStorage().remove(STORAGE_KEYS.REFRESH_TOKEN); // clean up any legacy token
        safeLocalStorage().remove(STORAGE_KEYS.USER);
        safeLocalStorage().remove(STORAGE_KEYS.SESSION_FLAG);

        // Clear session cookie so middleware doesn't serve stale protected pages
        if (typeof document !== 'undefined') {
          document.cookie = 'cc_session=; path=/; max-age=0; SameSite=Lax';
        }
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        _refreshing = false;
      }
    }

    // Normalize error message
    let message: string;
    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      message = 'Request timed out. Please check your connection and try again.';
    } else if (!error.response) {
      message = 'Unable to reach the server. Please check your connection.';
    } else {
      message =
        error.response.data?.message ||
        error.message ||
        'Something went wrong. Please try again.';
    }

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
