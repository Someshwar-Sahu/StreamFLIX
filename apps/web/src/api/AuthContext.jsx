import { createContext, useContext, useState } from "react";
import { getToken, saveToken as saveTokenToStorage, logout as clearToken, getRole } from "./auth";

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(getToken())
    const [role, setRole] = useState(getRole())

    function saveToken(newToken){
        saveTokenToStorage(newToken)
        setToken(newToken)
        setRole(getRole)
    } 

    function logout() {
        clearToken()
        setToken(null)
        setRole(null)
    }

    return (
        <AuthContext.Provider value={{ token, role, saveToken, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(){
    return useContext(AuthContext)
}