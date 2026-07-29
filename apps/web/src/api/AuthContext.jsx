import { createContext, useContext, useState, useEffect } from "react";
import {
    getToken, saveToken as saveTokenToStorage, logout as clearToken, getRole, 
    getProfileToken, saveProfileToken as saveProfileTokenToStorage,
    clearProfileToken, getProfileId,
} from "./auth";
import { getProfiles } from "./profiles";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(getToken());
    const [role, setRole] = useState(getRole());
    const [profileToken, setProfileToken] = useState(getProfileToken());
    const [profileId, setProfileId] = useState(getProfileId());
    const [currentProfile, setCurrentProfile] = useState(null);
    const [sessionExpired, setSessionExpired] = useState(false);

    useEffect(() => {
        function handleExpired() {
            setSessionExpired(true);
            setTimeout(() => setSessionExpired(false), 4000);
        }
        window.addEventListener("streamflix:session-expired", handleExpired);
        return () => window.removeEventListener("streamflix:session-expired", handleExpired);
    }, []);

    useEffect(() => {
        if (token && profileId) {
            getProfiles()
                .then((list) => {
                    const active = list.find((p) => p.id === profileId) || list[0] || null;
                    setCurrentProfile(active);
                })
                .catch(() => setCurrentProfile(null));
        } else {
            setCurrentProfile(null);
        }
    }, [token, profileId]);

    function saveToken(newToken) {
        saveTokenToStorage(newToken);
        setToken(newToken);
        setRole(getRole());

        clearProfileToken();
        setProfileToken(null);
        setProfileId(null);
        setCurrentProfile(null);
    }

    function selectProfile(newProfileToken) {
        saveProfileTokenToStorage(newProfileToken);
        setProfileToken(newProfileToken);
        const pid = getProfileId();
        setProfileId(pid);
    }

    function logout() {
        clearToken();
        setToken(null);
        setRole(null);
        setProfileToken(null);
        setProfileId(null);
        setCurrentProfile(null);
    }

    return (
        <AuthContext.Provider value={{ token, role, profileToken, profileId, currentProfile, saveToken, selectProfile, logout }}>
            {children}
            {sessionExpired && (
                <div style={toastStyle}>
                    ⚠️ Your session has expired. Redirecting to Login...
                </div>
            )}
        </AuthContext.Provider>
    );
}

const toastStyle = {
    position: 'fixed',
    top: 24,
    right: 24,
    backgroundColor: '#171B24',
    border: '1px solid #F2A93B',
    color: '#F2A93B',
    padding: '14px 20px',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '14px',
    boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
    zIndex: 9999,
    animation: 'fadeIn 0.3s ease',
};

export function useAuth() {
    return useContext(AuthContext);
}