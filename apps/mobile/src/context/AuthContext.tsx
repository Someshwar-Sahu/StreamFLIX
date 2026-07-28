import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, saveToken as persistToken, clearToken, getRole, getProfileToken, saveProfileToken as persistProfileToken, clearProfileToken, getProfileId } from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';

type AuthContextType = {
  token: string | null;
  role: string | null;
  profileToken: string | null;
  profileId: number | null;
  loading: boolean;
  saveToken: (token: string) => Promise<void>;
  selectProfile: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profileToken, setProfileToken] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
        const t = await getToken()
        const r = await getRole()
        const pt = await getProfileToken()
        const pid = await getProfileId()
        setToken(t)
        setRole(r)
        setProfileToken(pt)
        setProfileId(pid)
        setLoading(false)
    })()
  }, [])

  async function logout() {
    await clearToken();
    setToken(null);
    setRole(null);
    setProfileToken(null);
    setProfileId(null);
  }

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, []);

  async function saveToken(newToken: string) {
    await persistToken(newToken);
    setToken(newToken);
    const r = await getRole()
    setRole(r)
    // fresh login invalidates any previously selected profile
    await clearProfileToken();
    setProfileToken(null);
    setProfileId(null);
  }

  async function selectProfile(newProfileToken: string) {
    await persistProfileToken(newProfileToken);
    setProfileToken(newProfileToken);
    const pid = await getProfileId();
    setProfileId(pid);
  }

  return (
    <AuthContext.Provider value={{ token, role, profileToken, profileId, loading, saveToken, selectProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}