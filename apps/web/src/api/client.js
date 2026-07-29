import axios from "axios";
import { getToken, getProfileToken, logout } from "./auth";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const profileToken = getProfileToken();
  const token = profileToken || getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isLoggingOut = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!isLoggingOut) {
        isLoggingOut = true;
        logout();
        
        // Dispatch custom session expired event
        window.dispatchEvent(new CustomEvent("streamflix:session-expired"));
        
        // Force redirect to /login
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        
        setTimeout(() => {
          isLoggingOut = false;
        }, 3000);
      }
    }
    return Promise.reject(error);
  }
);

export default api;