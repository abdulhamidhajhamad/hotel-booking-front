import { http } from '@/lib/http';
import type { Amenity } from '../types';

export interface AmenityInput {
  name: string;
  icon: string | null;
}

export const adminAmenitiesApi = {
  async list() {
    const { data } = await http.get<Amenity[]>('/admin/amenities');
    return data;
  },

  async create(input: AmenityInput) {
    const { data } = await http.post<Amenity>('/admin/amenities', input);
    return data;
  },

  async update(id: string, input: Partial<AmenityInput>) {
    const { data } = await http.patch<Amenity>(`/admin/amenities/${id}`, input);
    return data;
  },

  async remove(id: string) {
    await http.delete(`/admin/amenities/${id}`);
  },
};
