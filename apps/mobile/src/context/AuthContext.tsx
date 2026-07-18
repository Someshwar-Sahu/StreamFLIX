import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, saveToken as persistToken, clearToken, getRole } from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';

type AuthContextType = {
  token: string | null;
  role: string | null;
  loading: boolean;
  saveToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
        const t = await getToken()
        const r = await getRole()
        setToken(t)
        setRole(r)
        setLoading(false)
    })()
  }, [])

  async function logout() {
    await clearToken();
    setToken(null);
    setRole(null)
  }

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, []);

  async function saveToken(newToken: string) {
    await persistToken(newToken);
    setToken(newToken);
    const r = await getRole()
    setRole(r)
  }

  return (
    <AuthContext.Provider value={{ token, role, loading, saveToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}