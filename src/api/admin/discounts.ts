import { http } from '@/lib/http';
import type { Discount, PagedResult } from '../types';

export interface DiscountsQuery {
  roomId?: string;
  hotelId?: string;
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface DiscountInput {
  roomId: string;
  percentage: number;
  startUtc: string;
  endUtc: string;
  title: string | null;
}

export const adminDiscountsApi = {
  async list(query: DiscountsQuery) {
    const { data } = await http.get<PagedResult<Discount>>('/admin/discounts', { params: query });
    return data;
  },

  async create(input: DiscountInput) {
    const { data } = await http.post<Discount>('/admin/discounts', input);
    return data;
  },

  async remove(id: string) {
    await http.delete(`/admin/discounts/${id}`);
  },
};
