import axios from "axios"
import AsyncStorage  from "@react-native-async-storage/async-storage"

const api = axios.create({
    baseURL: "http://10.81.197.182:8000",
})

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('auth_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

export default api