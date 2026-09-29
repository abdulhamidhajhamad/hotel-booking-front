const STORAGE_KEY = 'hb.bookings';
const MAX_ENTRIES = 30;

export interface BookingHistoryEntry {
  bookingGroupId: string;
  confirmationNumber: string;
  totalPrice: number;
  paymentStatus: string;
  hotelNames: string[];
  createdAt: string;
}

function readAll(): BookingHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BookingHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export const bookingHistory = {
  list: readAll,
  add(entry: BookingHistoryEntry) {
    try {
      const next = [entry, ...readAll().filter((item) => item.bookingGroupId !== entry.bookingGroupId)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, MAX_ENTRIES)));
    } catch {
      /* storage unavailable - history is a convenience only */
    }
  },
};
