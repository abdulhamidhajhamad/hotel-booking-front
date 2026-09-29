import { http } from '@/lib/http';
import type { RoomType } from '../types';

export interface RoomTypeInput {
  name: string;
  description: string | null;
}

export const adminRoomTypesApi = {
  async list() {
    const { data } = await http.get<RoomType[]>('/admin/room-types');
    return data;
  },

  async create(input: RoomTypeInput) {
    const { data } = await http.post<RoomType>('/admin/room-types', input);
    return data;
  },

  async update(id: string, input: Partial<RoomTypeInput>) {
    const { data } = await http.patch<RoomType>(`/admin/room-types/${id}`, input);
    return data;
  },

  async remove(id: string) {
    await http.delete(`/admin/room-types/${id}`);
  },
};
