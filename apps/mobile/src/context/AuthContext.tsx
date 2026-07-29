import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { getToken, saveToken as persistToken, clearToken, getRole, getProfileToken, saveProfileToken as persistProfileToken, clearProfileToken, getProfileId } from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import { DESIGN_TOKENS } from '@streamflix/ui';

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
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    (async () => {
        const t = await getToken();
        const r = await getRole();
        const pt = await getProfileToken();
        const pid = await getProfileId();
        setToken(t);
        setRole(r);
        setProfileToken(pt);
        setProfileId(pid);
        setLoading(false);
    })();
  }, []);

  async function logout() {
    await clearToken();
    setToken(null);
    setRole(null);
    setProfileToken(null);
    setProfileId(null);
  }

  const handleUnauthorized = async () => {
    setSessionExpired(true);
    await logout();
    setTimeout(() => {
      setSessionExpired(false);
    }, 4000);
  };

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
  }, []);

  async function saveToken(newToken: string) {
    await persistToken(newToken);
    setToken(newToken);
    const r = await getRole();
    setRole(r);
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
      {sessionExpired && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>⚠️ Session Expired. Redirecting to Login...</Text>
        </View>
      )}
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastBanner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#171B24',
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.accentAmber,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 8,
    shadowColor: '#000',
    shadowRadius: 10,
    shadowOpacity: 0.5,
  },
  toastText: {
    color: DESIGN_TOKENS.colors.accentAmber,
    fontWeight: '700',
    fontSize: 13,
  },
});

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}