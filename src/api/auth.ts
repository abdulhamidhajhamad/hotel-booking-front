import { http } from '@/lib/http';
import type { RegisterResponse, TokenPair } from './types';

export const authApi = {
  async login(email: string, password: string) {
    const { data } = await http.post<TokenPair>('/auth/login', { email, password });
    return data;
  },

  async register(email: string, userName: string, password: string) {
    const { data } = await http.post<RegisterResponse>('/auth/register', { email, userName, password });
    return data;
  },

  async confirmEmail(token: string) {
    await http.post('/auth/confirm-email', { token });
  },

  async resendConfirmation(email: string) {
    await http.post('/auth/resend-confirmation', { email });
  },

  async logout() {
    await http.post('/auth/logout');
  },

  async logoutAll() {
    await http.post('/auth/logout-all');
  },
};
