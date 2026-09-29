import { http } from '@/lib/http';
import type {
  FeaturedDeal,
  HotelDetails,
  HotelSearchResult,
  PagedResult,
  RecentlyVisitedHotel,
  HotelCategoryValue,
} from './types';

export interface SearchHotelsParams {
  query?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number;
  minPrice?: number;
  maxPrice?: number;
  minStar?: number;
  category?: HotelCategoryValue;
  amenityIds?: string[];
  sortBy?: 'name' | 'price' | 'starRating';
  sortDesc?: boolean;
  page?: number;
  pageSize?: number;
}

export const hotelsApi = {
  async search(params: SearchHotelsParams) {
    const { data } = await http.get<PagedResult<HotelSearchResult>>('/hotels/search', { params });
    return data;
  },

  async featuredDeals(count = 5) {
    const { data } = await http.get<FeaturedDeal[]>('/hotels/featured-deals', { params: { count } });
    return data;
  },

  async recentlyVisited(count = 5) {
    const { data } = await http.get<RecentlyVisitedHotel[]>('/hotels/recently-visited', { params: { count } });
    return data;
  },

  async details(hotelId: string, checkIn?: string, checkOut?: string) {
    const params = checkIn && checkOut ? { checkIn, checkOut } : undefined;
    const { data } = await http.get<HotelDetails>(`/hotels/${hotelId}`, { params });
    return data;
  },
};
