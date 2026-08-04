import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const customIp = await AsyncStorage.getItem("custom_host_ip");
  if (customIp) {
    config.baseURL = customIp;
  }
  const profileToken = await AsyncStorage.getItem("profile_token");
  const token = profileToken || (await AsyncStorage.getItem("auth_token"));
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default api;
