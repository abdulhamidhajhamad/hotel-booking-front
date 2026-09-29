import { http } from '@/lib/http';
import type { AdminUser } from '../types';

export interface AdminUserInput {
  email: string;
  userName: string;
  password: string;
  role: 'User' | 'Admin';
}

export const adminUsersApi = {
  async create(input: AdminUserInput) {
    const { data } = await http.post<AdminUser>('/admin/users', input);
    return data;
  },
};
