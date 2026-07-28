import { createContext, useContext, useState } from "react";
import {
    getToken, saveToken as saveTokenToStorage, logout as clearToken, getRole , 
    getProfileToken, saveProfileToken as saveProfileTokenToStorage,
    clearProfileToken, getProfileId,
} from "./auth";

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(getToken())
    const [role, setRole] = useState(getRole())
    const [profileToken, setProfileToken] = useState(getProfileToken())
    const [profileId, setProfileId] = useState(getProfileId())

    function saveToken(newToken){
        saveTokenToStorage(newToken)
        setToken(newToken)
        setRole(getRole())

        clearProfileToken()
        setProfileToken(null)
        setProfileId(null)
    }

    function selectProfile(newProfileToken){
        saveProfileTokenToStorage(newProfileToken)
        setProfileToken(newProfileToken)
        setProfileId(getProfileId())
    }

    function logout() {
        clearToken()
        setToken(null)
        setRole(null)
        setProfileToken(null)
        setProfileId(null)
    }

    return (
        <AuthContext.Provider value={{ token, role, profileToken, profileId, saveToken, selectProfile, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(){
    return useContext(AuthContext)
}