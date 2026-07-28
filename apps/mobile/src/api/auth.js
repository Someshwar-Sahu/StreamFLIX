import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./client";

const TOKEN_KEY = 'auth_token'
const PROFILE_TOKEN_KEY = 'profile_token'

export async function saveProfileToken(token) {
    await AsyncStorage.setItem(PROFILE_TOKEN_KEY, token)
}

export async function getProfileToken() {
    return await AsyncStorage.getItem(PROFILE_TOKEN_KEY)
}

export async function getProfileId() {
    const token = await getProfileToken()
    if (!token) return null
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.profile_id || null
    } catch {
        return null
    }
}

export async function clearProfileToken() {
    await AsyncStorage.removeItem(PROFILE_TOKEN_KEY)
}

export async function saveToken(token) {
    await AsyncStorage.setItem(TOKEN_KEY, token)
}

export async function getToken() {
    return await AsyncStorage.getItem(TOKEN_KEY)
}

export async function getRole() {
    const token = await getToken()
    if(!token) return null
    try{
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.role
    } catch {
        return null
    }
}

export async function clearToken() {
    await AsyncStorage.removeItem(TOKEN_KEY)
    await AsyncStorage.removeItem(PROFILE_TOKEN_KEY)
}

export async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    return res.data.access_token
}

export async function register(email, username, password) {
    const res = await api.post('/auth/register', { email, username, password })
    return res.data.access_token
}