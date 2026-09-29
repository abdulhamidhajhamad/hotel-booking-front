import { http } from '@/lib/http';
import type { HotelCategoryValue, HotelDetail, HotelGridItem, PagedResult, UploadedImage } from '../types';

export interface HotelsQuery {
  search?: string;
  cityId?: string;
  minStar?: number;
  category?: HotelCategoryValue;
  sortBy?: 'name' | 'starRating' | 'createdAt';
  sortDesc?: boolean;
  page?: number;
  pageSize?: number;
}

export interface HotelInput {
  name: string;
  description: string | null;
  starRating: number;
  category: HotelCategoryValue;
  address: string;
  latitude: number | null;
  longitude: number | null;
  cityId: string;
  ownerName: string | null;
}

export const adminHotelsApi = {
  async list(query: HotelsQuery) {
    const { data } = await http.get<PagedResult<HotelGridItem>>('/admin/hotels', { params: query });
    return data;
  },

  async byId(id: string) {
    const { data } = await http.get<HotelDetail>(`/admin/hotels/${id}`);
    return data;
  },

  async create(input: HotelInput) {
    const { data } = await http.post<HotelDetail>('/admin/hotels', input);
    return data;
  },

  async update(id: string, input: Partial<HotelInput>) {
    const { data } = await http.patch<HotelDetail>(`/admin/hotels/${id}`, input);
    return data;
  },

  async remove(id: string) {
    await http.delete(`/admin/hotels/${id}`);
  },

  async uploadImages(hotelId: string, files: File[]) {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    const { data } = await http.post<UploadedImage[]>(`/admin/hotels/${hotelId}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async setPrimaryImage(hotelId: string, imageId: string) {
    await http.put(`/admin/hotels/${hotelId}/images/${imageId}/primary`);
  },

  async deleteImage(hotelId: string, imageId: string) {
    await http.delete(`/admin/hotels/${hotelId}/images/${imageId}`);
  },
};
