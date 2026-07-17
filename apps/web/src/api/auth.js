import api from "./client";

export function saveToken(token) {
  localStorage.setItem("token", token);
}

export function getToken() {
  return localStorage.getItem("token");
}

export function logout() {
  localStorage.removeItem("token");
}

export async function register(email, username, password) {
  const res = await api.post("/auth/register", { email, username, password });
  return res.data.access_token;
}

export async function login(email, password) {
  const res = await api.post("/auth/login", { email, password });
  return res.data.access_token;
}