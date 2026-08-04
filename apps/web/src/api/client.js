import axios from "axios";

export const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const customUrl = localStorage.getItem("custom_api_url");
    if (customUrl) return customUrl;
  }
  if (import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== "undefined" && window.location?.hostname) {
    const hostname = window.location.hostname;
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "") {
      const protocol = window.location.protocol.startsWith("https") ? "https" : "http";
      return `${protocol}://${hostname}:8000`;
    }
  }
  return "http://localhost:8000";
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const profileToken = localStorage.getItem("profile_token");
  const token = profileToken || localStorage.getItem("token");
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
        localStorage.removeItem("token");
        localStorage.removeItem("profile_token");
        
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