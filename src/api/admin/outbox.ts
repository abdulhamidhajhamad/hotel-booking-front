import { http } from '@/lib/http';
import type { OutboxDeadLetter } from '../types';

export const adminOutboxApi = {
  async deadLetters(skip = 0, take = 20) {
    const { data } = await http.get<OutboxDeadLetter[]>('/admin/outbox/dead-letters', {
      params: { skip, take },
    });
    return data;
  },

  async requeue(id: string) {
    await http.post(`/admin/outbox/${id}/requeue`);
  },
};
