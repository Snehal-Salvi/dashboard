import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../data/api';
import type { User } from '../types';

const SESSION_KEY = 'grap.session';

interface AuthValue {
  user: User | null;
  signIn: (userId: string) => Promise<User>;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

function restoreSession(): User | null {
  try {
    const id = sessionStorage.getItem(SESSION_KEY);
    return id ? (api.getUser(id) ?? null) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(restoreSession);

  const signIn = useCallback(async (userId: string) => {
    const u = await api.ssoSignIn(userId);
    sessionStorage.setItem(SESSION_KEY, u.id);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** For screens rendered behind <RequireAuth>, where a user is guaranteed. */
// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('No signed-in user');
  return user;
}
