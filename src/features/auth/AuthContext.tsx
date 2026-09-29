import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '@/api/auth';
import { parseAccessToken, type JwtUser } from '@/lib/jwt';
import { SESSION_EXPIRED_EVENT } from '@/lib/http';
import { tokenStore } from '@/lib/tokenStore';

interface AuthContextValue {
  user: JwtUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutEverywhere: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function currentUser(): JwtUser | null {
  const tokens = tokenStore.get();
  return tokens ? parseAccessToken(tokens.accessToken) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<JwtUser | null>(currentUser);

  useEffect(() => {
    const unsubscribe = tokenStore.subscribe((tokens) =>
      setUser(tokens ? parseAccessToken(tokens.accessToken) : null),
    );
    const onExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);

    return () => {
      unsubscribe();
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login(email, password);
    tokenStore.set(tokens);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* the local session is dropped regardless of the server answer */
    }
    tokenStore.clear();
  }, []);

  const logoutEverywhere = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } catch {
      /* the local session is dropped regardless of the server answer */
    }
    tokenStore.clear();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: !!user?.roles.includes('Admin'),
      login,
      logout,
      logoutEverywhere,
    }),
    [user, login, logout, logoutEverywhere],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
