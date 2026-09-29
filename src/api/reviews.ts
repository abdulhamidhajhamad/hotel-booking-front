import { http } from '@/lib/http';
import type { PagedResult, Review } from './types';

export const reviewsApi = {
  async forHotel(hotelId: string, page = 1, pageSize = 5) {
    const { data } = await http.get<PagedResult<Review>>(`/hotels/${hotelId}/reviews`, {
      params: { page, pageSize },
    });
    return data;
  },
};
