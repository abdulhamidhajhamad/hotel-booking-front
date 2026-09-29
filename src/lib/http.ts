import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import type { TokenPair } from '@/api/types';
import { tokenStore } from './tokenStore';

export const SESSION_EXPIRED_EVENT = 'hb:session-expired';

const AUTH_FREE_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/confirm-email', '/auth/resend-confirmation'];

export const http = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: { indexes: null },
});

let refreshing: Promise<TokenPair> | null = null;

function isAuthFree(url?: string) {
  return !!url && AUTH_FREE_PATHS.some((path) => url.startsWith(path));
}

async function refreshTokens(): Promise<TokenPair> {
  const tokens = tokenStore.get();
  if (!tokens?.refreshToken) throw new Error('No refresh token');

  const { data } = await axios.post<TokenPair>('/api/v1/auth/refresh', {
    refreshToken: tokens.refreshToken,
  });

  tokenStore.set(data);
  return data;
}

function endSession() {
  tokenStore.clear();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const tokens = tokenStore.get();
  if (tokens?.accessToken && !isAuthFree(config.url)) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;

    const canRetry =
      error.response?.status === 401 &&
      !!request &&
      !request._retried &&
      !isAuthFree(request.url) &&
      !!tokenStore.get()?.refreshToken;

    if (!canRetry) {
      if (error.response?.status === 401 && tokenStore.get()) endSession();
      return Promise.reject(error);
    }

    request._retried = true;

    try {
      refreshing ??= refreshTokens().finally(() => {
        refreshing = null;
      });
      const tokens = await refreshing;
      request.headers = { ...request.headers, Authorization: `Bearer ${tokens.accessToken}` };
      return http.request(request);
    } catch {
      endSession();
      return Promise.reject(error);
    }
  },
);
