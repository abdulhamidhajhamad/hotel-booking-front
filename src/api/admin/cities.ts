import { http } from '@/lib/http';
import type { CityDetail, CityGridItem, PagedResult, UploadedImage } from '../types';

export interface CitiesQuery {
  search?: string;
  sortBy?: 'name' | 'country' | 'createdAt';
  sortDesc?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CityInput {
  name: string;
  country: string;
  postalCode: string | null;
  timezone: string;
}

export const adminCitiesApi = {
  async list(query: CitiesQuery) {
    const { data } = await http.get<PagedResult<CityGridItem>>('/admin/cities', { params: query });
    return data;
  },

  async byId(id: string) {
    const { data } = await http.get<CityDetail>(`/admin/cities/${id}`);
    return data;
  },

  async create(input: CityInput) {
    const { data } = await http.post<CityDetail>('/admin/cities', input);
    return data;
  },

  async update(id: string, input: Partial<CityInput>) {
    const { data } = await http.patch<CityDetail>(`/admin/cities/${id}`, input);
    return data;
  },

  async remove(id: string) {
    await http.delete(`/admin/cities/${id}`);
  },

  async uploadImages(cityId: string, files: File[]) {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    const { data } = await http.post<UploadedImage[]>(`/admin/cities/${cityId}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteImage(cityId: string, imageId: string) {
    await http.delete(`/admin/cities/${cityId}/images/${imageId}`);
  },
};
