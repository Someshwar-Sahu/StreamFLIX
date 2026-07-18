import React, { createContext, useContext, useEffect, useState } from "react";
import { getToken, saveToken as persistToken, clearToken } from '../api/auth'

type AuthContextType = {
    token: string | null;
    loading: boolean;
    saveToken: (token: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children } : { children: React.ReactNode}) {
    const [token, setToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getToken().then((t) => {
            setToken(t);
            setLoading(false);
        })
    }, [])

    async function saveToken(newToken:string) {
        await persistToken(newToken)
        setToken(newToken)
    }

    async function logout() {
        await clearToken()
        setToken(null)
    }

    return (
        <AuthContext.Provider value={{ token, loading, saveToken, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return  ctx
}