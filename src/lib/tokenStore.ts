import type { TokenPair } from '@/api/types';

const STORAGE_KEY = 'hb.tokens';

type Listener = (tokens: TokenPair | null) => void;

const listeners = new Set<Listener>();
let current: TokenPair | null = read();

function read(): TokenPair | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TokenPair) : null;
  } catch {
    return null;
  }
}

function write(tokens: TokenPair | null) {
  try {
    if (tokens) localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable (private mode) - keep tokens in memory only */
  }
}

export const tokenStore = {
  get: () => current,
  set(tokens: TokenPair) {
    current = tokens;
    write(tokens);
    listeners.forEach((listener) => listener(current));
  },
  clear() {
    current = null;
    write(null);
    listeners.forEach((listener) => listener(null));
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
