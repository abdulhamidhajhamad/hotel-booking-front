import { http } from '@/lib/http';
import type { PagedResult, RoomDetail, RoomGridItem, UploadedImage } from '../types';

export interface RoomsQuery {
  roomTypeId?: string;
  minAdults?: number;
  minChildren?: number;
  isActive?: boolean;
  search?: string;
  sortBy?: 'number' | 'price' | 'adults' | 'children' | 'createdAt';
  sortDesc?: boolean;
  page?: number;
  pageSize?: number;
}

export interface RoomInput {
  roomTypeId: string;
  number: string;
  adultsCapacity: number;
  childrenCapacity: number;
  pricePerNight: number;
  isActive: boolean;
}

export const adminRoomsApi = {
  async list(hotelId: string, query: RoomsQuery) {
    const { data } = await http.get<PagedResult<RoomGridItem>>(`/admin/hotels/${hotelId}/rooms`, {
      params: query,
    });
    return data;
  },

  async byId(hotelId: string, roomId: string) {
    const { data } = await http.get<RoomDetail>(`/admin/hotels/${hotelId}/rooms/${roomId}`);
    return data;
  },

  async create(hotelId: string, input: RoomInput) {
    const { data } = await http.post<RoomDetail>(`/admin/hotels/${hotelId}/rooms`, input);
    return data;
  },

  async update(hotelId: string, roomId: string, input: Partial<RoomInput>) {
    const { data } = await http.patch<RoomDetail>(`/admin/hotels/${hotelId}/rooms/${roomId}`, input);
    return data;
  },

  async remove(hotelId: string, roomId: string) {
    await http.delete(`/admin/hotels/${hotelId}/rooms/${roomId}`);
  },

  async uploadImages(hotelId: string, roomId: string, files: File[]) {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    const { data } = await http.post<UploadedImage[]>(
      `/admin/hotels/${hotelId}/rooms/${roomId}/images`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  async deleteImage(hotelId: string, roomId: string, imageId: string) {
    await http.delete(`/admin/hotels/${hotelId}/rooms/${roomId}/images/${imageId}`);
  },
};
