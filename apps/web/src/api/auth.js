import api from "./client";

export function saveToken(token) {
  localStorage.setItem("token", token);
}

export function getToken() {
  return localStorage.getItem("token");
}

export function getRole() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("profile_token");
}

export async function register(email, username, password) {
  const res = await api.post("/auth/register", { email, username, password });
  return res.data.access_token;
}

export async function login(email, password) {
  const res = await api.post("/auth/login", { email, password });
  return res.data.access_token;
}

export function saveProfileToken(token){
  localStorage.setItem("profile_token", token)
}

export function getProfileToken( ){
  return localStorage.getItem("profile_token")
}

export function getProfileId(){
  const token = getProfileToken()
  if(!token) return null
  try{
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.profile_id || null
  } catch {
    return null
  }
}
export function clearProfileToken() {
  localStorage.removeItem("profile_token")
}