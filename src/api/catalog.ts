import { http } from '@/lib/http';
import type { Amenity, TrendingDestination } from './types';

export const catalogApi = {
  async trendingDestinations(count = 5) {
    const { data } = await http.get<TrendingDestination[]>('/cities/trending', { params: { count } });
    return data;
  },

  async amenities() {
    const { data } = await http.get<Amenity[]>('/amenities');
    return data;
  },
};
