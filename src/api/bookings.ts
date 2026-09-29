import { http } from '@/lib/http';
import { parseBlobProblem } from '@/lib/problem';
import type { CreateBookingRequest, CreateBookingResult, Invoice, PayBookingResult } from './types';

export const bookingsApi = {
  async createHold(request: CreateBookingRequest, idempotencyKey: string) {
    const { data } = await http.post<CreateBookingResult>(
      '/bookings',
      { ...request, idempotencyKey },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
    return data;
  },

  async pay(bookingGroupId: string, paymentMethodId: string) {
    const { data } = await http.post<PayBookingResult>(
      `/bookings/${bookingGroupId}/payment`,
      { paymentMethodId },
    );
    return data;
  },

  async invoice(bookingGroupId: string) {
    const { data } = await http.get<Invoice>(`/bookings/${bookingGroupId}/invoice`);
    return data;
  },

  async invoicePdf(bookingGroupId: string) {
    try {
      const { data } = await http.get<Blob>(`/bookings/${bookingGroupId}/invoice/pdf`, {
        responseType: 'blob',
      });
      return data;
    } catch (error) {
      throw await parseBlobProblem(error);
    }
  },
};
