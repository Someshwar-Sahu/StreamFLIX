import axios from "axios"
import AsyncStorage  from "@react-native-async-storage/async-storage"
import { API_BASE_URL } from "../config"

const api = axios.create({
    baseURL: API_BASE_URL,
})

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('auth_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && onUnauthorized){
            onUnauthorized()
        }
        return Promise.reject(error)
    }
)

export default api