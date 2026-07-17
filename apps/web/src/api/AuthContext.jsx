import { createContext, useContext, useState } from "react";
import { getToken, saveToken as saveTokenToStorage, logout as clearToken } from "./auth";

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(getToken())

    function saveToken(newToken){
        saveTokenToStorage(newToken)
        setToken(newToken)
    } 

    function logout() {
        clearToken()
        setToken(null)
    }

    return (
        <AuthContext.Provider value={{ token, saveToken, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(){
    return useContext(AuthContext)
}