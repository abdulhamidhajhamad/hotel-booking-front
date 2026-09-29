import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { nightsBetween } from '@/lib/dates';

const STORAGE_KEY = 'hb.cart';

export interface CartItem {
  roomId: string;
  hotelId: string;
  hotelName: string;
  roomNumber: string;
  roomTypeName: string;
  thumbnailUrl: string | null;
  pricePerNight: number;
  originalPricePerNight: number;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}

export const cartItemKey = (item: CartItem) => `${item.roomId}|${item.checkIn}|${item.checkOut}`;

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: CartItem) => void;
  remove: (key: string) => void;
  clear: () => void;
  has: (roomId: string, checkIn: string, checkOut: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

function read(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable - the cart still works for this tab */
  }
}

export function itemNights(item: CartItem) {
  return nightsBetween(item.checkIn, item.checkOut);
}

export function itemTotal(item: CartItem) {
  return item.pricePerNight * itemNights(item);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(read);

  const update = useCallback((next: CartItem[]) => {
    setItems(next);
    write(next);
  }, []);

  const add = useCallback(
    (item: CartItem) => {
      const key = cartItemKey(item);
      update([...read().filter((existing) => cartItemKey(existing) !== key), item]);
    },
    [update],
  );

  const remove = useCallback(
    (key: string) => update(read().filter((item) => cartItemKey(item) !== key)),
    [update],
  );

  const clear = useCallback(() => update([]), [update]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.length,
      total: items.reduce((sum, item) => sum + itemTotal(item), 0),
      add,
      remove,
      clear,
      has: (roomId, checkIn, checkOut) =>
        items.some(
          (item) => item.roomId === roomId && item.checkIn === checkIn && item.checkOut === checkOut,
        ),
    }),
    [items, add, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
